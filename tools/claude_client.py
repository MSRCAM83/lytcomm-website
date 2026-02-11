"""
LYT Communications - Claude API Client
Sends work order text + map tiles to Claude Opus 4.6 for structured extraction.
Output format matches EXTRACTION_PROMPT.md / importProjectFromExtraction().
"""

import json
import os
import re

import httpx
from anthropic import Anthropic


def build_system_prompt(has_tiles: bool) -> str:
    """Build system prompt with extraction rules and map reading instructions."""
    prompt = """You are a fiber optic construction data extraction specialist for LYT Communications. You extract structured data from construction maps and work orders with 100% accuracy.

YOUR TASK: Read the work order line items (text) and the construction map (images). Extract EVERY segment, structure, splice point, and billable line item. Output ONLY valid JSON.

THREE BUCKETS OF DATA TO EXTRACT:

BUCKET 1 - WORK ORDER LINE ITEMS:
Copy every line item from the work order table. These go in the "line_items" array with code, description, uom, quantity.

BUCKET 2 - SEGMENTS (from map, WITH billing):
Each segment between structures gets its own entry with GPS coordinates estimated from street names.

BUCKET 3 - SPLICE POINTS (from map, tracking only):
Create records for each splice location. Splicing is a separate work order.

GPS COORDINATE ESTIMATION:
You MUST estimate GPS coordinates for every structure and segment endpoint using:
- Street names visible on the construction map
- City/area from the project info (e.g., "Sulphur, LA")
- Intersection positions and relative layout
- Known distances between structures (footage numbers)
- Your geographic knowledge of actual street positions in the area
Coordinates should place structures on the correct streets in approximately the right positions.
Format: decimal degrees (e.g., 30.2266, -93.3774).

CRITICAL MAP READING RULES:
- RED NUMBERS = Conduit footage (billable boring) - read EXACTLY as printed
- GREY NUMBERS = Slack loop storage (NOT separate bore footage)
- RED TEXT STARTING WITH LETTERS = Labels, not footage
- SECTION LETTERS (A, B, C, D, E, F) come from labels on the map
- MAP LEGEND in top right shows color coding for cable types (024F vs 048F)
- "PLACE X" CALLOUTS have arrows pointing to their sections - follow arrows for duct count
- PLACE 1 = 1 duct bore, PLACE 2 = 2 duct bore, PLACE 3 = 3 duct bore

SEGMENT ENDPOINTS:
- Footage is point-to-point between ANY structures
- Structures include: Handholes (get ground rods) AND Flowerpots (no ground rods)

CABLE TYPE:
- Cable runs have TEXT LABELS (024F, 048F, etc.)
- Cable runs are COLOR CODED per LEGEND
- Match cable type to the correct pull code from WO line items

DISCREPANCY HANDLING:
- Use Work Order quantities as source of truth
- If map counts differ from WO, LOG the discrepancy in reconciliation.notes

ACCURACY RULES:
- Read footage numbers EXACTLY as printed. Do not estimate, round, or guess.
- Use EXACT unit codes from the rate card. Do not invent codes.
- Every billable item from the WO MUST appear in line_items.
- Count carefully. If the map shows 14 flowerpots, quantity should be 14.
- Your entire response must be a single valid JSON object. No text before or after."""

    if has_tiles:
        prompt += """

MAP TILE PROCESSING INSTRUCTIONS:
The construction map has been split into high-resolution tiles for accurate reading.
1. LEGEND TILE: Read this FIRST. Learn all symbols, line colors (cable types), and their meanings.
2. KEY MAP TILE: Shows the overview with section boundaries.
3. SECTION TILES (R1C1, R1C2, R2C1, R2C2): Detailed map sections in a 2x2 grid.
   - R1C1 = top-left, R1C2 = top-right
   - R2C1 = bottom-left, R2C2 = bottom-right
4. Each tile shows a zoomed-in portion. Carefully read ALL text in each tile.
5. Features at tile edges may appear in adjacent tiles — verify across boundaries.
6. Do NOT skip any tile. Every tile may contain unique data."""

    return prompt


def build_extraction_prompt(wo_text: str, map_text: str, has_tiles: bool) -> str:
    """Build the user extraction prompt with WO text and output format."""
    prompt = """TASK: Extract ALL construction project data from the work order text AND map images.

STEP 1 - Read the work order text. Copy EVERY line item exactly. Extract job code, customer, WO number.
STEP 2 - Read the map images for physical layout, structures, footage, streets, duct counts.
STEP 3 - Estimate GPS coordinates for all structures and segment endpoints using street names and city.
STEP 4 - Build line_items array linking each billable item to its segment/structure.
STEP 5 - Log any discrepancies between map and WO in reconciliation.

=== VALID UNIT CODES (use EXACT codes from this list) ===

Aerial:
AE1 (LF), AE2 (LF), AE3 (LF), AE3.1 (LF), AE4 (EA), AE5 (EA), AE6 (EA), AE7 (EA),
AE8 (LF), AE9L (EA), AE9S (EA), AE10 (Span), AE11 (Span), AE12 (LF), AE13 (EA),
AE14 (EA), AE15 (EA), AE17 (EA), AE18 (LF), AE19 (EA), AE31 (EA), AE31.1 (LF)

Fiber Splicing:
FS1 (EA), FS2 (EA), FS3 (EA), FS4 (EA), FS05 (EA)

Underground Boring:
UG1 (LF), UG2 (LF), UG3 (LF), UG16 (LF), UG23 (LF), UG24 (LF), UG21 (LF),
UG29 (LF), UG30 (LF), UG32 (LF)

Underground Pulling:
UG4 (LF), UG22 (LF), UG28 (LF)

Underground Direct Bury:
UG5 (LF), UG6 (EA), UG7 (LF), UG8 (LF)

Underground Structures:
UG9 (EA), UG10 (EA), UG11 (EA), UG12 (EA), UG13 (EA), UG14 (EA), UG15 (EA),
UG17 (EA), UG18 (EA), UG19 (EA), UG20 (EA), UG27 (EA), UG31 (EA)

Poles:
PP1 (EA), PP2 (EA), PP3 (EA), BCP (EA)

Restoration:
PA01 (SF), PA02 (SF), PA02A (SF), PC01 (SF), PC02 (SF), PC02A (SF), RA1 (CF), RC1 (CF)

Other:
HSPH (EA), TC1 (HR)

Hourly Personnel:
L10A (HR), L30A (HR), L40A (HR), L50A (HR), L70A (HR)

Hourly Equipment:
E10 (HR), E20 (HR), E30 (HR), E40 (HR), E50 (HR), E60 (HR), E70 (HR), E80 (HR), E82 (HR)

"""

    if wo_text and len(wo_text) > 30:
        prompt += f"""
========================================
WORK ORDER TEXT (billing source of truth):
========================================
{wo_text}
========================================

"""

    if map_text and len(map_text) > 30:
        prompt += f"""
MAP EMBEDDED TEXT (supplementary - images are primary):
{map_text}

"""

    if has_tiles:
        prompt += """
The map tiles follow. Process in order:
1. Read the LEGEND tile - learn cable colors and all symbols
2. Check the KEY MAP for section layout
3. Scan each section tile R1C1 -> R1C2 -> R2C1 -> R2C2
4. For each tile, extract ALL structures, footage numbers, cable labels, street names
5. Cross-reference across tile boundaries for features that span edges

"""

    prompt += """REQUIRED JSON OUTPUT — use this EXACT structure:
{
  "project": {
    "name": "[Work order name/number - Location]",
    "work_order_number": "[WO number from document]",
    "client": "Vexus",
    "region": "[LA or TX]",
    "rate_card": "vexus-la-tx-2026",
    "location": "[City, State]",
    "date_received": "[Date from WO or today's date]"
  },

  "segments": [
    {
      "segment_id": "SEG-001",
      "description": "[What this bore/route is - street names, from/to]",
      "street_name": "[Primary street]",
      "footage": 0,
      "duct_count": 0,
      "cable_type": "[e.g. 144ct armored, 288ct, micro 72ct]",
      "gps_start": { "lat": 0.0, "lng": 0.0 },
      "gps_end": { "lat": 0.0, "lng": 0.0 },
      "status": "Not Started"
    }
  ],

  "structures": [
    {
      "id": "[HH-001, FP-001, GR-001, PED-001, TB-001, MP-001]",
      "type": "[handhole, flowerpot, ground_rod, pedestal, terminal_box, marker_post, aux_ground]",
      "size": "[dimensions if handhole, otherwise omit]",
      "unit_code": "[UG code]",
      "segment_id": "[which segment this sits on]",
      "gps": { "lat": 0.0, "lng": 0.0 },
      "status": "Not Started"
    }
  ],

  "splice_points": [
    {
      "splice_id": "SP-001",
      "splice_type": "[1x4, 1x8, F1, TYCO-D, ribbon]",
      "unit_code": "FS1",
      "fiber_count": 0,
      "handhole_id": "[which handhole this splice is in]",
      "segment_id": "[which segment]",
      "gps": { "lat": 0.0, "lng": 0.0 },
      "status": "Not Started"
    }
  ],

  "line_items": [
    {
      "code": "[unit code from rate card]",
      "description": "[description]",
      "uom": "[LF, EA, SF, CF, HR, Span]",
      "quantity": 0,
      "segment_id": "[optional - link to segment if applicable]",
      "structure_id": "[optional - link to structure if applicable]",
      "splice_id": "[optional - link to splice if applicable]"
    }
  ],

  "reconciliation": {
    "total_footage": 0,
    "total_segments": 0,
    "total_structures": 0,
    "total_splice_points": 0,
    "total_line_items": 0,
    "unmatched_items": ["[any WO items that don't match a rate card code]"],
    "notes": ["[anything unusual, discrepancies, items needing clarification]"]
  }
}

RULES:
1. Every billable item from the WO MUST appear in line_items
2. Structures on the map go in BOTH structures[] (with GPS) AND line_items[] (with quantity and code)
3. Splices go in BOTH splice_points[] AND line_items[]
4. Use EXACT unit codes from the rate card above — do not invent codes
5. Count carefully — if map shows 14 flowerpots, quantity = 14
6. GPS coordinates: estimate from street names + city using your geographic knowledge
7. Segment IDs: SEG-001, SEG-002, etc.
8. Structure IDs by type: HH-001, FP-001, GR-001, PED-001, TB-001, MP-001, AG-001
9. Splice IDs: SP-001, SP-002, etc.
10. If WO lists items you cannot match to any code above, put them in reconciliation.unmatched_items

Return ONLY JSON. No markdown, no commentary."""

    return prompt


def extract_with_claude(
    wo_text: str,
    map_text: str,
    map_tiles: list[dict],
    api_key: str,
) -> dict:
    """
    Call Claude Opus 4.6 with work order text + map tiles.
    Returns parsed extraction JSON dict.
    """
    # Use longer timeout for large extractions (up to 15 minutes)
    client = Anthropic(
        api_key=api_key,
        timeout=httpx.Timeout(900.0, connect=30.0),
    )

    has_tiles = len(map_tiles) > 0
    system_prompt = build_system_prompt(has_tiles)
    extraction_prompt = build_extraction_prompt(wo_text, map_text, has_tiles)

    # Build content blocks
    content = [{"type": "text", "text": extraction_prompt}]

    # Add map tile images
    if map_tiles:
        content.append({
            "type": "text",
            "text": (
                f"\n--- CONSTRUCTION MAP: {len(map_tiles)} HIGH-RESOLUTION TILES ---\n"
                "The map has been split into tiles for maximum readability.\n"
                "TILE ORDER: Legend first, then Key Map overview, then section tiles.\n"
                "Each tile is a zoomed-in section. Read EVERY label, number, and symbol.\n"
            ),
        })
        for tile in map_tiles:
            content.append({"type": "text", "text": f"\n[{tile['label']}]:"})
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": tile["base64"],
                },
            })

    print(f"Calling Claude Opus 4.6 via streaming (max_tokens=64000)...")
    print(f"  WO text: {len(wo_text)} chars, map tiles: {len(map_tiles)}")

    # Use streaming to handle long-running extraction
    raw_text = ""
    input_tokens = 0
    output_tokens = 0
    stop_reason = None

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=64000,
        system=system_prompt,
        messages=[{"role": "user", "content": content}],
    ) as stream:
        chars_received = 0
        for text_chunk in stream.text_stream:
            raw_text += text_chunk
            chars_received += len(text_chunk)
            # Print progress every 5000 chars
            if chars_received % 5000 < len(text_chunk):
                print(f"  ...received {chars_received} chars so far")

        # Get final message for usage stats
        final_message = stream.get_final_message()
        stop_reason = final_message.stop_reason
        if final_message.usage:
            input_tokens = final_message.usage.input_tokens
            output_tokens = final_message.usage.output_tokens

    print(f"Response: {len(raw_text)} chars, stop_reason={stop_reason}")
    print(f"  Tokens: {input_tokens} in / {output_tokens} out")

    if stop_reason == "max_tokens":
        print("  WARNING: Response truncated at max_tokens. Will attempt JSON repair.")

    # Parse JSON with fallback strategies
    extracted = _parse_json_response(raw_text)
    if extracted is None:
        raise ValueError(
            "Could not parse AI response as JSON. "
            f"Raw preview: {raw_text[:500]}"
        )

    return extracted


def _parse_json_response(raw_text: str) -> dict | None:
    """Parse JSON from Claude response with 3-level fallback."""
    # Strategy 1: Direct parse (strip markdown fences)
    try:
        cleaned = re.sub(r"```json\n?", "", raw_text)
        cleaned = re.sub(r"```\n?", "", cleaned).strip()
        if not cleaned.startswith("{"):
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                cleaned = match.group(0)
        return json.loads(cleaned)
    except (json.JSONDecodeError, AttributeError):
        pass

    # Strategy 2: Brace extraction
    try:
        brace_start = raw_text.index("{")
        brace_end = raw_text.rindex("}")
        if brace_end > brace_start:
            return json.loads(raw_text[brace_start : brace_end + 1])
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 3: Truncation repair
    try:
        return _repair_truncated_json(raw_text)
    except (ValueError, json.JSONDecodeError):
        pass

    return None


def _repair_truncated_json(raw_text: str) -> dict | None:
    """Repair truncated JSON from max_tokens cutoff."""
    start = raw_text.find("{")
    if start == -1:
        return None

    truncated = raw_text[start:]
    if len(truncated) < 10:
        return None

    # Try closing at each } from the end
    for i in range(len(truncated) - 1, 100, -1):
        if truncated[i] == "}":
            try:
                return json.loads(truncated[: i + 1])
            except json.JSONDecodeError:
                continue

    # Count unclosed braces/brackets and close them
    # Strip trailing incomplete entries
    truncated = re.sub(r',\s*"[^"]*"?\s*:?\s*"?[^",\]\}]*$', "", truncated)
    truncated = re.sub(r',\s*\{[^\}]*$', "", truncated)
    truncated = re.sub(r',\s*\[[^\]]*$', "", truncated)
    truncated = re.sub(r",\s*$", "", truncated)

    braces = 0
    brackets = 0
    in_string = False
    escape = False

    for ch in truncated:
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            braces += 1
        elif ch == "}":
            braces -= 1
        elif ch == "[":
            brackets += 1
        elif ch == "]":
            brackets -= 1

    if in_string:
        truncated += '"'
    truncated += "]" * brackets
    truncated += "}" * braces

    print(f"  JSON repair: closed {braces} braces, {brackets} brackets")
    return json.loads(truncated)
