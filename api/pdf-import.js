/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 3.1.0
 * Updated: 2026-02-04
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4.5 Vision API.
 * 
 * v3.1.0: COMPLETE EXTRACTION - 4 bucket model:
 *         1. WO line items (faithful copy from work order table)
 *         2. Segments (boring + pulling + handhole + ground rod per segment)
 *         3. Splice points WITH billing (FS1/FS2/FS3/FS4 - previously excluded)
 *         4. Unallocated WO items (restoration, traffic, mobilization, etc.)
 *         Grand total = segments + splices + unallocated ≈ WO total.
 *         Fixed: splice billing was completely dropped in v3.0.0.
 *         Fixed: prompt example now shows ALL work item types.
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
          model: 'claude-opus-4-5-20251101',
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
 * Build the system prompt - tile-aware version
 */
function buildSystemPrompt(isTiled) {
  let prompt = `You are a fiber optic construction data extraction specialist for LYT Communications. You extract structured data from construction maps and work orders with 100% accuracy.

YOUR TASK: Read the work order line items (text) and the construction map (images). Extract EVERY segment, handhole, footage number, splice point, and street name. Then assign billing to each.

FOUR BUCKETS OF DATA TO EXTRACT:

BUCKET 1 - WORK ORDER LINE ITEMS:
Copy every line item from the work order table exactly as printed: code, description, qty, uom, rate, total. This is the billing source of truth.

BUCKET 2 - SEGMENTS (from map):
Each segment between two handholes gets work_items for:
- Boring: UG1 ($8.00/LF for 1-4 ducts), UG23 ($9.50/LF for 5 ducts), or UG24 ($10.50/LF for 6 ducts)
  → The map shows duct counts in callout boxes like "PLACE 4 - 1.25" HDPE DUCTS" = UG1
  → "PLACE 5 - 1.25" HDPE DUCTS" = UG23, "PLACE 6" = UG24
- Pulling: UG4 ($0.55/LF) for distribution cable (branch runs), UG28 ($1.00/LF) for feeder cable (288-432ct on inter-section hub-to-hub runs)
- Handhole install at destination: UG20 ($40/EA for 15x20x12 TB), UG17 ($60/EA for 17x30x18), UG27 ($210/EA for 30x48x24), etc.
- Ground rod: UG13 ($40/EA) at each handhole

BUCKET 3 - SPLICE POINTS (from map, WITH billing):
Each splice point gets work_items:
- 1x4 mid-span terminal: FS2 ($275 ring cut) + FS1 x2 fibers ($33) + FS3 x8 tests ($52.80) = $360.80
- 1x4 end-of-line terminal: FS4 ($137.50 case setup) + FS1 x2 ($33) + FS3 x8 ($52.80) = $223.30
- 1x8 mid-span splitter: FS2 ($275) + FS1 x2 ($33) + FS3 x8 ($52.80) = $360.80
- 1x8 end-of-line splitter: FS4 ($137.50) + FS1 x2 ($33) + FS3 x8 ($52.80) = $223.30
- F1/TYCO-D butt splice (432ct): FS4 ($137.50) + FS1 x432 ($7,128) = $7,265.50 per splice

BUCKET 4 - UNALLOCATED WO ITEMS:
Any work order line items that don't map to specific segments or splices (restoration, traffic control, mobilization, locate wire, tracer tape, etc.)

CRITICAL ACCURACY RULES:
- Read footage numbers EXACTLY as printed. Do not estimate, round, or guess.
- The work order total_value is the source of truth for the project total.
- grand_total = sum of all segment values + all splice values + all unallocated items.
- grand_total should approximately equal the work order total_value.
- Your entire response must be a single valid JSON object. No text before or after.`;

  if (isTiled) {
    prompt += `

MAP TILE PROCESSING INSTRUCTIONS:
The construction map has been split into high-resolution tiles for accurate reading.
1. LEGEND TILE: Read this FIRST. Learn all symbols, line colors, and their meanings.
2. KEY MAP TILE: Shows the overview with section boundaries labeled.
3. SECTION TILES (R1C1 through R2C3): These are the detailed map sections in a 3x2 grid.
   - R1C1 = top-left, R1C2 = top-center, R1C3 = top-right
   - R2C1 = bottom-left, R2C2 = bottom-center, R2C3 = bottom-right
4. Each tile shows a zoomed-in portion. Carefully read ALL text in each tile:
   - Handhole labels (single letters A,B,C = hubs, A01,A02,B01 = terminals)
   - Footage numbers (small text along route lines between handholes)
   - Street names (text along roads)
   - Splice callout boxes (rectangular text boxes near handholes)
   - Duct placement descriptions (PLACE X - 1.25" HDPE DUCTS...)
5. Features at tile edges may appear in adjacent tiles — verify across boundaries.
6. Do NOT skip any tile. Every tile may contain unique data.`;
  }

  return prompt;
}

function buildExtractionPrompt(workOrderText, mapText, rateCardId, hasMapImages, isTiled) {
  let prompt = `TASK: Extract ALL construction project data from the work order text AND map images.

STEP 1 - READ THE WORK ORDER text below. Copy EVERY line item exactly.
STEP 2 - READ THE MAP ${isTiled ? 'TILES' : 'IMAGES'} for physical layout, handholes, footage, streets, duct counts.
STEP 3 - ASSIGN BILLING: For each segment, calculate boring + pulling + handhole + ground rod. For each splice, calculate FS codes.
STEP 4 - RECONCILE: grand_total (segments + splices + unallocated) should approximately equal work order total_value.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

=== BILLING RATES ===

Underground Boring (check map duct count callouts):
- UG1: Directional bore 1-4 ducts (1.25" ID) = $8.00/LF
- UG23: Directional bore 5 ducts (1.25" ID) = $9.50/LF
- UG24: Directional bore 6 ducts (1.25" ID) = $10.50/LF

Cable Pulling:
- UG4: Pull up to 144ct armored/micro cable = $0.55/LF (branch/distribution runs)
- UG28: Place 288-432ct armored fiber in duct = $1.00/LF (feeder on inter-section hub-to-hub runs)

Handholes (assign to segment ENDING at this handhole):
- UG10: 30x48x30 fiberglass/polycrete = $310.00/EA
- UG11: 24x36x24 fiberglass/polycrete = $110.00/EA
- UG12: Utility Box = $20.00/EA
- UG13: Ground rod 5/8"x8' = $40.00/EA (one per handhole)
- UG17: 17x30x18 HDPE handhole = $60.00/EA
- UG18: 24x36x18 HDPE handhole = $125.00/EA
- UG19: 30x48x18 HDPE handhole = $250.00/EA
- UG20: Terminal Box (15x20x12) = $40.00/EA
- UG27: 30x48x24 HDPE handhole = $210.00/EA

Splicing (assign to splice_points work_items):
- FS1: Fusion splice 1 fiber = $16.50/EA
- FS2: Ring cut (mid-span terminals) = $275.00/EA
- FS3: Test Fiber (OTDR/power meter) = $6.60/EA
- FS4: ReEnter/Install Enclosure (end-of-line) = $137.50/EA

=== HANDHOLE SIZE to TYPE ===
- 15x20x12 = Terminal Box (TB) -> typically 1x4 splice
- 17x30x18 = HDPE Handhole (B) -> 1x8 or 1x4
- 30x48x24 = Large Handhole (LHH) -> F1/TYCO-D butt splice (432 fibers)

=== SPLICE BILLING FORMULAS ===
1x4 mid-span: FS2 ($275) + FS1x2 ($33) + FS3x8 ($52.80) = $360.80
1x4 end-of-line: FS4 ($137.50) + FS1x2 ($33) + FS3x8 ($52.80) = $223.30
1x8 mid-span: FS2 ($275) + FS1x2 ($33) + FS3x8 ($52.80) = $360.80
1x8 end-of-line: FS4 ($137.50) + FS1x2 ($33) + FS3x8 ($52.80) = $223.30
F1 butt splice (432ct): FS4 ($137.50) + FS1x432 ($7128) = $7265.50

=== SECTION NAMING ===
- Single letters (A,B,C,D,E,F) = hub/main handholes
- Numbered (A01,A02,B01) = branch handholes from that hub
- Segments: hub to branch (A to A01) or hub to hub (A to B for inter-section links)

=== POSITION TYPE ===
- end-of-line: LAST handhole in a chain (no onward connections)
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
      prompt += `\nThe map tiles follow. Process in order:\n1. Read the LEGEND tile to learn all symbols\n2. Check the KEY MAP for section layout\n3. Scan each section tile R1C1 to R1C2 to R1C3 to R2C1 to R2C2 to R2C3\n4. For each tile, extract ALL handholes, footage numbers, streets, splice callouts, and duct count callouts\n5. Cross-reference across tile boundaries for features that span edges\n\n`;
    } else {
      prompt += `\nMap images follow. Examine EVERY page for handholes, footage, streets, duct counts.\n\n`;
    }
  }

  prompt += `REQUIRED JSON OUTPUT:
{
  "project": {
    "customer": "string",
    "project_name": "string",
    "po_number": "string",
    "total_value": number,
    "start_date": "YYYY-MM-DD",
    "completion_date": "YYYY-MM-DD",
    "rate_card_id": "${rateCardId || 'vexus-la-tx-2026'}"
  },
  "work_order_line_items": [
    { "code": "UG1", "description": "Directional bore 1-4 ducts", "qty": 25000, "uom": "LF", "rate": 8.00, "total": 200000.00 },
    { "code": "UG4", "description": "Pull cable up to 144ct", "qty": 25000, "uom": "LF", "rate": 0.55, "total": 13750.00 },
    { "code": "UG13", "description": "Ground rod", "qty": 50, "uom": "EA", "rate": 40.00, "total": 2000.00 },
    { "code": "FS1", "description": "Fusion splice 1 fiber", "qty": 500, "uom": "EA", "rate": 16.50, "total": 8250.00 }
  ],
  "segments": [
    {
      "contractor_id": "A->A01",
      "section": "A",
      "from_handhole": "A",
      "to_handhole": "A01",
      "from_hh_size": "17x30x18",
      "to_hh_size": "15x20x12",
      "footage": 148,
      "street": "W Parish Rd",
      "duct_count": 4,
      "cable_type": "distribution",
      "work_items": [
        { "code": "UG1", "qty": 148, "rate": 8.00, "total": 1184.00, "desc": "Directional bore 4 ducts" },
        { "code": "UG4", "qty": 148, "rate": 0.55, "total": 81.40, "desc": "Pull cable" },
        { "code": "UG20", "qty": 1, "rate": 40.00, "total": 40.00, "desc": "Terminal Box at A01" },
        { "code": "UG13", "qty": 1, "rate": 40.00, "total": 40.00, "desc": "Ground rod at A01" }
      ],
      "total_value": 1345.40
    },
    {
      "contractor_id": "A->B",
      "section": "A-B",
      "from_handhole": "A",
      "to_handhole": "B",
      "from_hh_size": "17x30x18",
      "to_hh_size": "17x30x18",
      "footage": 500,
      "street": "Main St",
      "duct_count": 4,
      "cable_type": "feeder",
      "work_items": [
        { "code": "UG1", "qty": 500, "rate": 8.00, "total": 4000.00, "desc": "Directional bore 4 ducts" },
        { "code": "UG28", "qty": 500, "rate": 1.00, "total": 500.00, "desc": "Place 432ct feeder cable" },
        { "code": "UG17", "qty": 1, "rate": 60.00, "total": 60.00, "desc": "17x30x18 HDPE at B" },
        { "code": "UG13", "qty": 1, "rate": 40.00, "total": 40.00, "desc": "Ground rod at B" }
      ],
      "total_value": 4600.00
    }
  ],
  "splice_points": [
    {
      "contractor_id": "A01",
      "location": "Handhole A01 (15x20x12)",
      "handhole_type": "15x20x12",
      "splice_type": "1x4",
      "position_type": "mid-span",
      "fiber_count": 2,
      "tray_count": 1,
      "work_items": [
        { "code": "FS2", "qty": 1, "rate": 275.00, "total": 275.00, "desc": "Ring cut (mid-span)" },
        { "code": "FS1", "qty": 2, "rate": 16.50, "total": 33.00, "desc": "Fusion splice" },
        { "code": "FS3", "qty": 8, "rate": 6.60, "total": 52.80, "desc": "Test fiber" }
      ],
      "total_value": 360.80
    },
    {
      "contractor_id": "F1-Entry",
      "location": "Handhole ENTRY (30x48x24)",
      "handhole_type": "30x48x24",
      "splice_type": "F1",
      "position_type": "end-of-line",
      "fiber_count": 432,
      "tray_count": 8,
      "work_items": [
        { "code": "FS4", "qty": 1, "rate": 137.50, "total": 137.50, "desc": "Install enclosure" },
        { "code": "FS1", "qty": 432, "rate": 16.50, "total": 7128.00, "desc": "Fusion splice 432 fibers" }
      ],
      "total_value": 7265.50
    }
  ],
  "unallocated_items": [
    { "code": "XX", "description": "WO line item not assigned to a segment or splice", "qty": 1, "uom": "EA", "rate": 100.00, "total": 100.00 }
  ],
  "sections": ["A", "B", "C", "D", "E", "F"],
  "total_footage": number,
  "total_segments": number,
  "total_splice_points": number,
  "segments_total": number,
  "splices_total": number,
  "unallocated_total": number,
  "grand_total": number
}

RULES:
1. grand_total = segments_total + splices_total + unallocated_total
2. segments_total = sum of all segment total_values
3. splices_total = sum of all splice_point total_values
4. unallocated_total = sum of all unallocated_items totals
5. grand_total should approximately equal the work order project total_value
6. Include EVERY segment from the map - do not skip any
7. Read footage EXACTLY - do not estimate
8. Handhole install costs go in the segment ending at that handhole
9. Splice billing (FS1-FS4) goes in splice_points work_items NOT in segments
10. work_order_line_items = faithful copy of EVERY line from the work order table
11. unallocated_items = WO line items that cannot be assigned to specific segments or splices
12. If the map shows PLACE X ducts use: 1-4 ducts=UG1, 5 ducts=UG23, 6 ducts=UG24
13. Inter-section hub-to-hub runs (A to B, B to C, D to E, E to F) typically carry feeder cable (UG28 at $1.00/LF)
14. Branch runs (A to A01, B to B03) carry distribution cable (UG4 at $0.55/LF)

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
