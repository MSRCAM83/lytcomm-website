/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 4.1.0
 * Updated: 2026-02-04
 *
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4.6 Vision API.
 *
 * v4.1.0: EVERY billable item gets unique ID. Separate entity lists:
 *         - handholes[], flowerpots[], ground_rods[], segments[], splice_points[]
 *         - Even 30ft road crossings get segment IDs
 *         - Quantities and codes only - rates applied by website
 *         - Supports multiple rate views (customer vs contractor)
 * v4.0.2: Use EXACT unit codes from WO (e.g., UG04-M024 not UG04)
 * v4.0.1: Removed hardcoded prices - rates now extracted from WO line items
 * v4.0.0: COMPLETE REWRITE with confirmed extraction rules:
 *         - Duct codes: UG01/UG02/UG03 based on PLACE X callouts
 *         - Flowerpots ARE segment endpoints (no ground rods)
 *         - Splicing is SEPARATE WO - track splice points but DON'T bill
 *         - Map reading: red numbers = footage, grey = slack loops
 *         - Cable types from labels AND color legend
 *         - Component IDs: {JOB_CODE}-{TYPE}-{SEQ} format
 *         - PM readings at 1x4 locations (8 per location, "No Light" option)
 *         - Discrepancy handling: use WO qty, log differences
 * v3.1.0: 4 bucket model with splice billing (now removed per rules)
 * v3.0.0: TILED MAP INPUT - 8 high-res tiles at 4x scale.
 * v2.9.0: Split processing. WO as text, map as images.
 * v2.8.0: Upgraded to Opus 4.5.
 *
 * POST /api/pdf-import
 * Body: {
 *   work_order_text,
 *   map_text, map_images[], map_tile_labels[],
 *   rate_card_id
 * }
 *
 * Requires: ANTHROPIC_API_KEY env var, Fluid Compute enabled
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const { 
      work_order_text,
      map_text, map_images, map_tile_labels,
      rate_card_id 
    } = req.body;

    let mapImgs = map_images || [];
    const tileLabels = map_tile_labels || [];
    const MAX_MAP_IMAGES = 16; // Allow more now since tiles are smaller
    if (mapImgs.length > MAX_MAP_IMAGES) {
      mapImgs = mapImgs.slice(0, MAX_MAP_IMAGES);
      console.log(`Map images capped at ${MAX_MAP_IMAGES} (was ${map_images.length})`);
    }

    const hasWOText = work_order_text && work_order_text.length > 30;
    const hasMapImages = mapImgs.length > 0;
    const hasMapText = map_text && map_text.length > 30;
    const isTiled = tileLabels.length > 0;

    if (!hasWOText && !hasMapImages && !hasMapText) {
      return res.status(400).json({ error: 'No extractable content.' });
    }

    console.log(`Processing v3.0.0: WO text=${(work_order_text||'').length} chars, map images=${mapImgs.length}${isTiled ? ' (TILED)' : ''}, map text=${(map_text||'').length} chars`);

    // Build message content array
    const contentBlocks = [];

    // Main extraction prompt with WO text embedded
    contentBlocks.push({
      type: 'text',
      text: buildExtractionPrompt(work_order_text, map_text, rate_card_id, hasMapImages, isTiled),
    });

    // Map images - with tile labels if available
    if (hasMapImages) {
      if (isTiled) {
        // TILED MODE: Label each tile so Claude knows what region it's looking at
        contentBlocks.push({
          type: 'text',
          text: `\n--- CONSTRUCTION MAP: ${mapImgs.length} HIGH-RESOLUTION TILES ---\n` +
            `The map has been split into tiles for maximum readability.\n` +
            `TILE ORDER: Legend first, then Key Map overview, then section tiles left-to-right, top-to-bottom.\n` +
            `Each tile is a zoomed-in section. Read EVERY label, number, and symbol in each tile.\n` +
            `Tiles may overlap at edges — use this to verify data across tile boundaries.\n`,
        });
        for (let i = 0; i < mapImgs.length; i++) {
          const label = tileLabels[i] || `Tile ${i + 1}`;
          contentBlocks.push({
            type: 'text',
            text: `\n[${label}]:`,
          });
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: mapImgs[i],
            },
          });
        }
      } else {
        // LEGACY MODE: Full page images
        contentBlocks.push({
          type: 'text',
          text: `\n--- CONSTRUCTION MAP PAGES (${mapImgs.length} images) ---\n` +
            `Read every handhole label, footage number, and street name.\n`,
        });
        for (let i = 0; i < mapImgs.length; i++) {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: mapImgs[i],
            },
          });
        }
      }
    }

    // Safety timeout at 750s
    const controller = new AbortController();
    const safetyTimer = setTimeout(() => controller.abort(), 750000);

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 64000,
          system: buildSystemPrompt(isTiled),
          messages: [{ role: 'user', content: contentBlocks }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(safetyTimer);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'AI processing timed out after 750s.' });
      }
      throw fetchErr;
    }
    clearTimeout(safetyTimer);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: 'AI extraction failed', status: response.status, details: errText.substring(0, 500) });
    }

    const data = await response.json();
    
    let rawText = '';
    if (data.content && Array.isArray(data.content)) {
      rawText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
    }
    
    console.log(`Response: ${data.content?.length || 0} blocks, text: ${rawText.length} chars, model: ${data.model}, stop: ${data.stop_reason}, usage: ${JSON.stringify(data.usage || {})}`);
    
    if (data.stop_reason === 'max_tokens') {
      console.warn('Response truncated at 64000 tokens. Will attempt JSON repair.');
    }

    // Parse JSON
    let extracted = null;
    
    try {
      let cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
      }
      extracted = JSON.parse(cleaned);
      console.log('JSON parsed (direct)');
    } catch (e1) {
      try {
        const braceStart = rawText.indexOf('{');
        const braceEnd = rawText.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd > braceStart) {
          extracted = JSON.parse(rawText.substring(braceStart, braceEnd + 1));
          console.log('JSON recovered (brace extraction)');
        }
      } catch (e2) {
        try {
          extracted = repairTruncatedJSON(rawText);
          if (extracted) console.log('JSON recovered (repair)');
        } catch (e3) {
          console.error('All JSON parse strategies failed');
          console.error('Raw preview:', rawText.substring(0, 1000));
        }
      }
    }
    
    if (!extracted) {
      return res.status(200).json({
        warning: 'Could not parse AI response as JSON',
        raw_response: rawText.substring(0, 5000),
        usage: data.usage,
      });
    }

    return res.status(200).json({
      success: true,
      extracted,
      usage: data.usage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('PDF import error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Build the system prompt - tile-aware version (v4.0.0)
 */
function buildSystemPrompt(isTiled) {
  let prompt = `You are a fiber optic construction data extraction specialist for LYT Communications. You extract structured data from construction maps and work orders with 100% accuracy.

YOUR TASK: Read the work order line items (text) and the construction map (images). Extract EVERY segment, handhole, flowerpot, footage number, and splice point location. Assign billing for segments ONLY (splicing is a separate work order).

THREE BUCKETS OF DATA TO EXTRACT:

BUCKET 1 - WORK ORDER LINE ITEMS:
Copy every line item from the work order table exactly as printed: code, description, qty, uom, rate, total.
IMPORTANT: The rates in this table are the SOURCE OF TRUTH for all billing calculations.

BUCKET 2 - SEGMENTS (from map, WITH billing):
Each segment between structures (handholes OR flowerpots) gets work_items.
USE THE EXACT CODES AND RATES FROM THE WORK ORDER LINE ITEMS.
- Boring: UG01/UG02/UG03 based on duct count from "PLACE X" callouts
- Pulling: Use the EXACT pull code from WO (e.g., UG04-M024, UG04-M048, UG04-A024, UG28-288)
- Handhole/Flowerpot install at destination: UG12/UG17/UG18/UG20/UG27 etc.
- Ground rod: UG13 at each HANDHOLE only (NOT flowerpots)

BUCKET 3 - SPLICE POINTS (from map, NO billing - tracking only):
Create records for each splice location but DO NOT add work_items (splicing is a separate work order):

1x4 TERMINALS (at Terminal Boxes):
- 2 splitters inside (not 1)
- 8 power meter readings total: SA1P1, SA1P2, SA1P3, SA1P4, SB1P5, SB1P6, SB1P7, SB1P8
- Each PM reading needs: actual dBm value (number), status
- Status options: "pending", "no_light" (fiber not lit yet), "pass", "warning", "fail"
- 1 photo per splitter (2 total PM photos, not 8)
- 7 enclosure photos + 2 PM photos = 9 total photos

2x8 HUBS (at larger handholes):
- NO power meter testing at these locations
- 8 enclosure photos required

TYCO-D/F1 at 30x48x24 LHH:
- "9 SPLICES" callout = part of this job's splice WO
- Track location for workflow

CRITICAL: EXTRACT QUANTITIES AND CODES ONLY - NO RATE CALCULATIONS
Do NOT calculate totals or apply rates. The website will apply rates from the selected rate card.
Extract: unit codes, quantities, and descriptions only.
The same extraction supports multiple rate views (customer billing vs contractor payment).

CRITICAL MAP READING RULES:
- RED NUMBERS = Conduit footage (billable boring) - read EXACTLY as printed
- GREY NUMBERS = Slack loop storage (NOT separate bore footage)
- RED TEXT STARTING WITH LETTERS = Labels, not footage
- SECTION LETTERS (A, B, C, D, E, F) come from labels on the map
- MAP LEGEND in top right shows color coding for cable types (024F vs 048F)
- "PLACE X" CALLOUTS have arrows pointing to their sections - follow arrows for duct count

DISCREPANCY HANDLING:
- Use Work Order quantities as source of truth
- If map counts differ from WO, LOG the discrepancy but continue extraction
- Extraction does NOT pause for human review

COMPONENT ID FORMAT:
Generate unique IDs for EVERY billable component using job code from WO.
Even small 30-foot road crossings get their own segment ID.

- Handholes: {JOB_CODE}-HH-{NNN} (e.g., SLPH.01.006-HH-001) - each is billable
- Flowerpots: {JOB_CODE}-FP-{NNN} (e.g., SLPH.01.006-FP-001) - each is billable
- Ground Rods: {JOB_CODE}-GR-{NNN} (e.g., SLPH.01.006-GR-001) - 1 per handhole
- Segments: {JOB_CODE}-SEG-{NNN} (e.g., SLPH.01.006-SEG-001) - each bore/pull run
- Splice Points: {JOB_CODE}-SP-{NNN} (e.g., SLPH.01.006-SP-001) - tracking only
- Splitters: {JOB_CODE}-SPL-{NNN} (e.g., SLPH.01.006-SPL-001) - 2 per 1x4, 1 photo each
- PM Readings: {JOB_CODE}-PM-{NNN} (e.g., SLPH.01.006-PM-001) - 8 per 1x4 (4 per splitter)

Every billable/trackable item = unique ID. No exceptions.

CRITICAL ACCURACY RULES:
- Read footage numbers EXACTLY as printed. Do not estimate, round, or guess.
- Extract QUANTITIES and CODES only - do NOT calculate rates or totals.
- Use EXACT unit codes from WO (e.g., UG04-M024 not just UG04).
- Splicing is separate WO - create splice point records but no work_items.
- Rates will be applied by the website based on selected rate card.
- Your entire response must be a single valid JSON object. No text before or after.`;

  if (isTiled) {
    prompt += `

MAP TILE PROCESSING INSTRUCTIONS:
The construction map has been split into high-resolution tiles for accurate reading.
1. LEGEND TILE: Read this FIRST. Learn all symbols, line colors (cable types), and their meanings.
2. KEY MAP TILE: Shows the overview with section boundaries labeled (A, B, C, D, E, F).
3. SECTION TILES (R1C1 through R2C3): Detailed map sections in a 3x2 grid.
   - R1C1 = top-left, R1C2 = top-center, R1C3 = top-right
   - R2C1 = bottom-left, R2C2 = bottom-center, R2C3 = bottom-right
4. Each tile shows a zoomed-in portion. Carefully read ALL text in each tile:
   - Handhole labels (single letters A,B,C = hubs with 2x8; A01,A02,B01 = terminals with 1x4)
   - Flowerpot symbols (utility boxes along routes - ARE segment endpoints)
   - Footage numbers: RED = conduit (bill), GREY = slack loops (don't bill separately)
   - Cable labels on runs (024F, 048F) with matching legend colors
   - Street names (text along roads)
   - "PLACE X" callouts with arrows pointing to duct count areas
5. Features at tile edges may appear in adjacent tiles — verify across boundaries.
6. Do NOT skip any tile. Every tile may contain unique data.`;
  }

  return prompt;
}

function buildExtractionPrompt(workOrderText, mapText, rateCardId, hasMapImages, isTiled) {
  let prompt = `TASK: Extract ALL construction project data from the work order text AND map images.

STEP 1 - READ THE WORK ORDER text below. Copy EVERY line item exactly. Extract job code (e.g., SLPH.01.006).
STEP 2 - BUILD A RATE LOOKUP TABLE from the work order line items (code → rate).
STEP 3 - READ THE MAP ${isTiled ? 'TILES' : 'IMAGES'} for physical layout, handholes, flowerpots, footage, streets, duct counts.
STEP 4 - ASSIGN BILLING: For each segment, use the RATES FROM THE WORK ORDER to calculate costs.
STEP 5 - CREATE SPLICE POINT RECORDS: Track location and type but NO billing (splicing is separate WO).
STEP 6 - LOG DISCREPANCIES: If map counts differ from WO, note in discrepancies array.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

=== UNIT CODES (Use EXACT codes from Work Order line items) ===

CRITICAL: Use the EXACT unit codes that appear in the Work Order line items table.
Do NOT substitute or simplify codes. If WO shows "UG04-M024", use "UG04-M024" not "UG04".
Do NOT include rates or calculate totals - extract QUANTITIES and CODES only.

Underground Boring (from "PLACE X" callouts with arrows on map):
- UG01: 1 duct bore
- UG02: 2 duct bore
- UG03: 3 duct bore
- UG16: 4 duct bore (if present in WO)

Cable Pulling (match EXACT code from WO based on cable type):
- Look at WO line items for the exact pull codes used (e.g., UG04-M024, UG04-M048, UG04-A024, UG28-288, etc.)
- 024F cable: use the 024 variant code from WO (e.g., UG04-M024 or UG04-A024)
- 048F cable: use the 048 variant code from WO (e.g., UG04-M048 or UG04-A048)
- Larger cables: may use UG28-288, UG28-432, etc.

Handholes (assign to segment ENDING at this structure):
- UG12: Utility Box / Flowerpot (NO ground rod for these)
- UG17: 17x30x18 HDPE handhole
- UG18: 24x36x18 HDPE handhole
- UG20: Terminal Box (15x20x12)
- UG27: 30x48x24 HDPE Large Handhole

Ground Rods:
- UG13: Ground rod
- ONE per HANDHOLE only (NOT for flowerpots/utility boxes)

IMPORTANT:
1. Extract QUANTITIES and CODES only - do NOT calculate totals
2. Use the EXACT unit codes as they appear in the WO (including suffixes like -M024, -A048, -288, etc.)
3. Rates will be applied by the website based on selected rate card

=== MAP READING RULES ===

FOOTAGE NUMBERS:
- RED NUMBERS = Conduit footage (billable boring) - read EXACTLY as printed
- GREY NUMBERS = Slack loop storage footage (NOT billed separately)
- RED TEXT STARTING WITH LETTERS = Labels, not footage (ignore for billing)

SEGMENT ENDPOINTS:
- Footage is point-to-point between ANY structures
- Structures include: Handholes (get ground rods) AND Flowerpots (no ground rods)

DUCT COUNT:
- Look for "PLACE 1", "PLACE 2", "PLACE 3" callouts on map
- Callouts have ARROWS pointing to their sections
- PLACE 1 = UG01, PLACE 2 = UG02, PLACE 3 = UG03

CABLE TYPE:
- Cable runs have TEXT LABELS (024F, 048F, etc.)
- Cable runs are COLOR CODED per LEGEND (top right of map)
- Match cable type to the EXACT pull code from WO line items:
  - 024F cable → find the 024 pull code in WO (e.g., UG04-M024 or UG04-A024)
  - 048F cable → find the 048 pull code in WO (e.g., UG04-M048 or UG04-A048)
- 024F typically feeds 1x4 splitters, 048F typically feeds 2x8 splitters

SECTIONS:
- Section letters (A, B, C, D, E, F) come from LABELS on the map
- Single letters = Hub handholes with 2x8 splitters
- Numbered (A01, A02, B01) = Terminal handholes with 1x4 splitters

=== SPLICE POINTS (Track Only - NO Billing) ===

Splicing is a SEPARATE work order. Create records for tracking but do NOT add work_items:

1x4 Splice Locations (Terminal Boxes):
- Has 2 splitters inside
- Requires 8 power meter readings: SA1P1, SA1P2, SA1P3, SA1P4, SB1P5, SB1P6, SB1P7, SB1P8
- 7 enclosure photos required
- pm_readings array with status "pending" or "no_light"

2x8 Splice Locations (Hub Handholes):
- NO power meter testing required
- 8 enclosure photos required

TYCO-D / "9 SPLICES" at 30x48x24 LHH:
- This splice work IS part of this job (48ct fiber for 2x8)
- But billing goes to separate splice WO
- Track location for workflow

=== POSITION TYPE ===
- end-of-line: LAST structure in a chain (no onward connections)
- mid-span: Has connections continuing through it

`;

  if (workOrderText && workOrderText.length > 30) {
    prompt += `\n========================================\nWORK ORDER TEXT (billing source of truth):\n========================================\n${workOrderText}\n========================================\n\n`;
  }

  if (mapText && mapText.length > 30) {
    prompt += `\nMAP EMBEDDED TEXT (supplementary - images are primary):\n${mapText}\n\n`;
  }

  if (hasMapImages) {
    if (isTiled) {
      prompt += `\nThe map tiles follow. Process in order:
1. Read the LEGEND tile - learn cable colors (024F vs 048F) and all symbols
2. Check the KEY MAP for section layout (A, B, C, D, E, F)
3. Scan each section tile R1C1 → R1C2 → R1C3 → R2C1 → R2C2 → R2C3
4. For each tile, extract:
   - ALL handholes and flowerpots (both are segment endpoints)
   - RED footage numbers (conduit - billable)
   - GREY footage numbers (slack loops - note but don't bill separately)
   - Cable type labels (024F/048F) with colors matching legend
   - "PLACE X" callouts - follow arrows for duct count
   - Street names
5. Cross-reference across tile boundaries for features that span edges\n\n`;
    } else {
      prompt += `\nMap images follow. Examine EVERY page for handholes, flowerpots, footage (red=billable, grey=slack), cable labels, duct counts.\n\n`;
    }
  }

  prompt += `REQUIRED JSON OUTPUT:
{
  "project": {
    "job_code": "extracted from WO (e.g., SLPH.01.006)",
    "customer": "extracted from WO",
    "project_name": "extracted from WO",
    "po_number": "extracted from WO",
    "wo_total": "extracted from WO (number) - for reference only"
  },
  "work_order_line_items": [
    { "code": "UG01", "description": "Direct Bore 1-1.25in", "qty": 22149, "uom": "LF" },
    { "code": "UG04-M024", "description": "Pull 024F micro cable", "qty": 34083, "uom": "LF" },
    "... copy ALL line items from WO, NO rates ..."
  ],
  "handholes": [
    {
      "id": "{job_code}-HH-001",
      "label": "A (from map)",
      "type": "17x30x18",
      "code": "UG17",
      "section": "A",
      "street": "street name"
    },
    {
      "id": "{job_code}-HH-002",
      "label": "A01",
      "type": "15x20x12",
      "code": "UG20",
      "section": "A",
      "street": "street name"
    }
  ],
  "flowerpots": [
    {
      "id": "{job_code}-FP-001",
      "label": "FP near A01 (or map reference)",
      "code": "UG12",
      "section": "A",
      "street": "street name"
    }
  ],
  "ground_rods": [
    {
      "id": "{job_code}-GR-001",
      "code": "UG13",
      "handhole_id": "{job_code}-HH-001",
      "handhole_label": "A"
    }
  ],
  "segments": [
    {
      "id": "{job_code}-SEG-001",
      "section": "A",
      "from_structure_id": "{job_code}-HH-001",
      "from_label": "A",
      "to_structure_id": "{job_code}-HH-002",
      "to_label": "A01",
      "footage": 148,
      "street": "W Parish Rd",
      "bore": {
        "code": "UG02",
        "qty": 148,
        "duct_count": 2
      },
      "pull": {
        "code": "UG04-M024",
        "qty": 148,
        "cable_type": "024F"
      }
    },
    {
      "id": "{job_code}-SEG-002",
      "from_structure_id": "{job_code}-HH-002",
      "to_structure_id": "{job_code}-FP-001",
      "footage": 30,
      "street": "Road Crossing",
      "bore": { "code": "UG01", "qty": 30, "duct_count": 1 },
      "pull": { "code": "UG04-M024", "qty": 30, "cable_type": "024F" },
      "notes": "Small road crossing - still gets unique ID"
    }
  ],
  "splice_points": [
    {
      "id": "{job_code}-SP-001",
      "handhole_id": "{job_code}-HH-002",
      "handhole_label": "A01",
      "splice_type": "1x4",
      "splitter_count": 2,
      "position_type": "mid-span",
      "section": "A",
      "splitters": [
        {
          "id": "{job_code}-SPL-001",
          "name": "Splitter A",
          "photo_id": null,
          "readings": [
            { "id": "{job_code}-PM-001", "port": "SA1P1", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-002", "port": "SA1P2", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-003", "port": "SA1P3", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-004", "port": "SA1P4", "value_dBm": null, "status": "pending" }
          ]
        },
        {
          "id": "{job_code}-SPL-002",
          "name": "Splitter B",
          "photo_id": null,
          "readings": [
            { "id": "{job_code}-PM-005", "port": "SB1P5", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-006", "port": "SB1P6", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-007", "port": "SB1P7", "value_dBm": null, "status": "pending" },
            { "id": "{job_code}-PM-008", "port": "SB1P8", "value_dBm": null, "status": "pending" }
          ]
        }
      ],
      "enclosure_photos_required": 7,
      "pm_photos_required": 2,
      "total_photos_required": 9,
      "notes": "1x4: 2 splitters, 8 PM readings (4 per splitter), 1 photo per splitter. Splicing billed on separate WO."
    },
    {
      "id": "{job_code}-SP-002",
      "handhole_id": "{job_code}-HH-001",
      "handhole_label": "A",
      "splice_type": "2x8",
      "splitter_count": 1,
      "position_type": "hub",
      "section": "A",
      "pm_readings": [],
      "enclosure_photos_required": 8,
      "pm_photos_required": 0,
      "total_photos_required": 8,
      "notes": "2x8 hub - NO PM testing required. Splicing billed on separate WO."
    }
  ],
  "discrepancies": [
    { "type": "count_mismatch", "item": "Terminal Boxes", "wo_qty": 44, "map_qty": 48, "action": "using WO qty" }
  ],
  "sections": ["A", "B", "C", "D", "E", "F"],
  "counts": {
    "handholes": "count of handholes array",
    "flowerpots": "count of flowerpots array",
    "ground_rods": "count of ground_rods array (should = handholes)",
    "segments": "count of segments array",
    "splice_points": "count of splice_points array",
    "total_bore_footage": "sum of all segment bore.qty",
    "total_pull_footage": "sum of all segment pull.qty"
  }
}

RULES:
1. Extract QUANTITIES and CODES only - do NOT calculate rates or totals
2. Use EXACT unit codes from WO (e.g., UG04-M024 not just UG04)
3. Include EVERY segment from the map - do not skip any
4. Read RED footage EXACTLY - do not estimate. GREY footage is slack loops.
5. Handhole/flowerpot install goes in the segment ENDING at that structure
6. Ground rod (UG13) ONLY for handholes, NOT for flowerpots
7. splice_points have EMPTY work_items array (splicing is separate WO)
8. work_order_line_items = faithful copy of codes/qty from WO (no rates)
9. PLACE 1 = UG01, PLACE 2 = UG02, PLACE 3 = UG03 (duct count from callouts)
10. Use job_code from WO to generate component IDs: {job_code}-SEG-001, etc.
11. Log discrepancies between map and WO but use WO quantities
12. Website will apply rates from selected rate card after extraction

Return ONLY JSON. No markdown, no commentary.`;

  return prompt;
}

/**
 * Repair truncated JSON from max_tokens cutoff
 */
function repairTruncatedJSON(rawText) {
  let truncated = rawText.substring(rawText.indexOf('{'));
  if (!truncated || truncated.length < 10) return null;
  
  for (let i = truncated.length; i > 100; i--) {
    if (truncated[i] === '}') {
      try {
        return JSON.parse(truncated.substring(0, i + 1));
      } catch (e) { /* keep scanning */ }
    }
  }
  
  let braces = 0, brackets = 0, inString = false, escape = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  
  if (braces === 0 && brackets === 0 && !inString) {
    return JSON.parse(truncated);
  }
  
  if (inString) truncated += '"';
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^",\]\}]*$/, '');
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*\[?[^\]]*$/, '');
  truncated = truncated.replace(/,\s*\{[^\}]*$/, '');
  truncated = truncated.replace(/,\s*\[[^\]]*$/, '');
  truncated = truncated.replace(/,\s*$/, '');
  
  braces = 0; brackets = 0; inString = false; escape = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  
  if (inString) truncated += '"';
  for (let i = 0; i < brackets; i++) truncated += ']';
  for (let i = 0; i < braces; i++) truncated += '}';
  
  console.log(`JSON repair: closed ${braces} braces, ${brackets} brackets`);
  return JSON.parse(truncated);
}
