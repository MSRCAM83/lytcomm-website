/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 3.0.0
 * Updated: 2026-02-04
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4.5 Vision API.
 * 
 * v3.0.0: TILED MAP INPUT - Frontend now sends map as 8 high-res tiles
 *         (legend + key map + 6 section tiles at 4x scale) instead of
 *         1 low-res full-page image. System prompt updated to process
 *         legend first, then scan each tile for handholes/footage/streets.
 *         Tile labels passed via map_tile_labels array.
 *         7x more pixel detail per section = readable footage numbers.
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

YOUR TASK: Read the work order line items (text) and the construction map (images). Extract every segment, handhole, footage number, splice point, and street name.

CRITICAL ACCURACY RULES:
- Read footage numbers EXACTLY as printed. Do not estimate, round, or guess.
- Every segment between two handholes has a footage number printed along the route line.
- The work order total_value is the source of truth for the project total.
- Splicing is NOT in the work order — extract splice points but do NOT include splice billing in segment work_items.
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

STEP 1 - READ THE WORK ORDER text below for billing line items.
STEP 2 - READ THE MAP ${isTiled ? 'TILES' : 'IMAGES'} for physical layout, handholes, footage, streets.
STEP 3 - RECONCILE: Total map footage should match work order boring/pulling quantities.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

BILLING RATES:
Underground Boring:
- UG1: Directional bore 1-4 ducts (1.25" ID) = $8.00/LF
- UG23: Directional bore 5 ducts (1.25" ID) = $9.50/LF
- UG24: Directional bore 6 ducts (1.25" ID) = $10.50/LF
Cable Pulling:
- UG4: Pull up to 144ct armored/micro cable = $0.55/LF
- UG28: Place 288-432ct armored fiber in duct = $1.00/LF
Handholes:
- UG10: 30x48x30 fiberglass/polycrete = $310.00/EA
- UG11: 24x36x24 fiberglass/polycrete = $110.00/EA
- UG12: Utility Box = $20.00/EA
- UG13: Ground rod 5/8"x8' = $40.00/EA
- UG17: 17x30x18 HDPE handhole = $60.00/EA
- UG18: 24x36x18 HDPE handhole = $125.00/EA
- UG19: 30x48x18 HDPE handhole = $250.00/EA
- UG20: Terminal Box = $40.00/EA
- UG27: 30x48x24 HDPE handhole = $210.00/EA

HANDHOLE SIZE → TYPE:
- 15x20x12 = Terminal Box (TB) → 1x4 splice
- 17x30x18 = HDPE Handhole (B) → 1x8 or 1x4
- 30x48x24 = Large Handhole (LHH) → F1 butt splice

SECTION NAMING:
- Single letters (A,B,C,D,E,F) = hub/main handholes
- Numbered (A01,A02,B01) = branch handholes from that hub
- Segments connect: hub→branch (A→A01) or hub→hub (A→B)

POSITION TYPE:
- end-of-line: LAST handhole in chain (no onward connections)
- mid-span: Has connections continuing through it

`;

  if (workOrderText && workOrderText.length > 30) {
    prompt += `\n========================================\nWORK ORDER TEXT (billing source of truth):\n========================================\n${workOrderText}\n========================================\n\n`;
  }

  if (mapText && mapText.length > 30) {
    prompt += `\nMAP EMBEDDED TEXT (supplementary — images are primary):\n${mapText}\n\n`;
  }

  if (hasMapImages) {
    if (isTiled) {
      prompt += `\nThe map tiles follow. Process in order:\n1. Read the LEGEND tile to learn all symbols\n2. Check the KEY MAP for section layout\n3. Scan each section tile R1C1→R1C2→R1C3→R2C1→R2C2→R2C3\n4. For each tile, extract ALL handholes, footage numbers, streets, and splice callouts\n5. Cross-reference across tile boundaries for features that span edges\n\n`;
    } else {
      prompt += `\nMap images follow. Examine EVERY page for handholes, footage, streets.\n\n`;
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
    { "code": "UG1", "description": "...", "qty": number, "uom": "LF", "rate": number, "total": number }
  ],
  "segments": [
    {
      "contractor_id": "A→A01",
      "section": "A",
      "from_handhole": "A",
      "to_handhole": "A01",
      "from_hh_size": "17x30x18",
      "to_hh_size": "15x20x12",
      "footage": 148,
      "street": "W Parish Rd",
      "work_items": [
        { "code": "UG1", "qty": 148, "rate": 8.00, "total": 1184.00, "desc": "Directional bore" },
        { "code": "UG4", "qty": 148, "rate": 0.55, "total": 81.40, "desc": "Pull cable" },
        { "code": "UG20", "qty": 1, "rate": 40.00, "total": 40.00, "desc": "Terminal Box (A01)" },
        { "code": "UG13", "qty": 1, "rate": 40.00, "total": 40.00, "desc": "Ground rod" }
      ],
      "total_value": 1345.40
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
      "tray_count": 1
    }
  ],
  "sections": ["A", "B", "C", "D", "E", "F"],
  "total_footage": number,
  "total_segments": number,
  "total_splice_points": number,
  "grand_total": number
}

RULES:
1. grand_total = sum of all segment total_values
2. Include EVERY segment from the map
3. Read footage EXACTLY — do not estimate
4. Handhole install costs go in the segment work_items for the segment ENDING at that handhole
5. splice_points have NO work_items
6. work_order_line_items = raw lines from the work order for reference
7. Do NOT include splice billing (FS1-FS4) in segment work_items

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
