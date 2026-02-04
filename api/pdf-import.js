/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 2.9.0
 * Updated: 2026-02-04
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4.5 Vision API.
 * 
 * v2.9.0: MAJOR - Split processing. Work order as TEXT (no images).
 *         Map as HIGH-QUALITY images (full 4.5MB budget). Claude reads
 *         the work order line items first, then examines the map to
 *         match footage numbers and segments. Numbers must reconcile.
 *         65536 max_tokens for full extraction of large projects.
 * v2.8.1: Enhanced JSON repair for mid-key truncation.
 * v2.8.0: Upgraded to Opus 4.5 - better vision, 3x cheaper.
 * v2.7.0: Fluid Compute, full data, 800s timeout.
 * 
 * POST /api/pdf-import
 * Body: { 
 *   work_order_text,
 *   map_text, map_images[],
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
      map_text, map_images,
      rate_card_id 
    } = req.body;

    // Map images get the full budget (no WO images to compete with)
    let mapImgs = map_images || [];
    const MAX_MAP_IMAGES = 10;
    if (mapImgs.length > MAX_MAP_IMAGES) {
      mapImgs = mapImgs.slice(0, MAX_MAP_IMAGES);
      console.log(`Map images capped at ${MAX_MAP_IMAGES} (was ${map_images.length})`);
    }

    const hasWOText = work_order_text && work_order_text.length > 30;
    const hasMapImages = mapImgs.length > 0;
    const hasMapText = map_text && map_text.length > 30;

    if (!hasWOText && !hasMapImages && !hasMapText) {
      return res.status(400).json({ error: 'No extractable content. Need work order text and/or map images.' });
    }

    console.log(`Processing v2.9.0: WO text=${(work_order_text||'').length} chars, map images=${mapImgs.length}, map text=${(map_text||'').length} chars`);

    // Build message content array
    const contentBlocks = [];

    // Main extraction prompt with WO text embedded
    contentBlocks.push({
      type: 'text',
      text: buildExtractionPrompt(work_order_text, map_text, rate_card_id, hasMapImages),
    });

    // Map images (high resolution - this is the visual data)
    if (hasMapImages) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- CONSTRUCTION MAP PAGES (${mapImgs.length} high-resolution images) ---\nThese are high-resolution renders of the construction map/engineering drawings.\n\nCRITICAL INSTRUCTIONS FOR MAP READING:\n1. Find EVERY handhole label (single letters like A, B, C AND numbered like A01, A02, B01, etc.)\n2. Read the EXACT footage number printed between each pair of connected handholes\n3. Note the handhole size shown in the legend or next to each label (15x20x12, 17x30x18, 30x48x24)\n4. Read street names along each route\n5. Identify ALL sections (A through F or beyond)\n6. Look for splice markers (TYCO-D diamonds, terminal box symbols)\n7. The footage numbers are small text along the fiber route lines - zoom in mentally on each segment\n8. DO NOT estimate or round footage - read the EXACT number printed on the map\n9. Some footage numbers may be small or at angles - take extra care to read each digit correctly`,
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

    // Safety timeout at 750s (Vercel Fluid allows 800s)
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
          max_tokens: 65536,
          system: `You are a fiber optic construction data extraction specialist for LYT Communications. You extract structured data from construction maps and work orders.

YOUR TASK: Read the work order line items (provided as text) and the construction map (provided as images). Extract every segment, every handhole, every footage number. The work order tells you WHAT was ordered. The map tells you WHERE it goes.

CRITICAL RULES:
- Read footage numbers EXACTLY as printed on the map. Do not estimate or round.
- Every segment between two handholes has a footage number printed along the route line.
- The work order total_value is the source of truth for the project total.
- Splicing is NOT included in the work order - do NOT include splice billing in segment work_items.
- Segment work_items should include: boring (UG1/UG23/UG24), pulling (UG4/UG28), and handhole installations (UG10/UG11/UG12/UG13/UG17/UG18/UG19/UG20/UG27) as applicable.
- Match the work order line item quantities to the map segments where possible.
- Your entire response must be a single valid JSON object. No text before or after. Start with { end with }.`,
          messages: [{ role: 'user', content: contentBlocks }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(safetyTimer);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'AI processing timed out after 750s. Try uploading fewer pages.' });
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
    
    // Extract text from all text blocks (handles thinking blocks, multi-block)
    let rawText = '';
    if (data.content && Array.isArray(data.content)) {
      rawText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
    } else if (data.content?.[0]?.text) {
      rawText = data.content[0].text;
    }
    
    console.log(`Response: ${data.content?.length || 0} blocks, text length: ${rawText.length}, model: ${data.model || 'unknown'}, stop: ${data.stop_reason || 'unknown'}, usage: ${JSON.stringify(data.usage || {})}`);
    
    if (data.stop_reason === 'max_tokens') {
      console.warn('Response truncated (hit max_tokens 65536). Will attempt JSON repair.');
    }

    // Parse JSON with multiple fallback strategies
    let extracted = null;
    
    // Strategy 1: Direct parse
    try {
      let cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
      }
      extracted = JSON.parse(cleaned);
      console.log('JSON parsed successfully (direct)');
    } catch (e1) {
      // Strategy 2: Brace extraction
      try {
        const braceStart = rawText.indexOf('{');
        const braceEnd = rawText.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd > braceStart) {
          extracted = JSON.parse(rawText.substring(braceStart, braceEnd + 1));
          console.log('JSON recovered via brace extraction');
        }
      } catch (e2) {
        // Strategy 3: Repair truncated JSON
        try {
          extracted = repairTruncatedJSON(rawText);
          if (extracted) console.log('JSON recovered via repair');
        } catch (e3) {
          console.error('All JSON parse strategies failed');
          console.error('Raw text preview:', rawText.substring(0, 1000));
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
 * Repair truncated JSON from max_tokens cutoff
 */
function repairTruncatedJSON(rawText) {
  let truncated = rawText.substring(rawText.indexOf('{'));
  if (!truncated || truncated.length < 10) return null;
  
  // First, try to find the largest valid JSON object in the text
  for (let i = truncated.length; i > 100; i--) {
    if (truncated[i] === '}') {
      try {
        const parsed = JSON.parse(truncated.substring(0, i + 1));
        console.log(`JSON repair: found valid JSON ending at char ${i + 1} of ${truncated.length}`);
        return parsed;
      } catch (e) {
        // keep scanning backwards
      }
    }
  }
  
  // Aggressive repair: close open structures
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
  
  // Remove trailing partial values
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^",\]\}]*$/, '');
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*\[?[^\]]*$/, '');
  truncated = truncated.replace(/,\s*\{[^\}]*$/, '');
  truncated = truncated.replace(/,\s*\[[^\]]*$/, '');
  truncated = truncated.replace(/,\s*$/, '');
  
  // Recount after cleanup
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

function buildExtractionPrompt(workOrderText, mapText, rateCardId, hasMapImages) {
  let prompt = `TASK: Extract ALL construction project data by reading the work order text AND examining the construction map images.

STEP 1 - READ THE WORK ORDER: The work order text below contains the complete list of unit codes, quantities, rates, and totals. This is the billing source of truth.

STEP 2 - READ THE CONSTRUCTION MAP: The map images show the physical layout - handhole locations, footage between handholes, street names, and section routing. Read EVERY footage number EXACTLY as printed.

STEP 3 - RECONCILE: Match the map segments to the work order line items. The total footage from all segments on the map should correspond to the boring/pulling quantities in the work order.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

BILLING RATES REFERENCE:
Underground Boring:
- UG1: Directional bore 1-4 ducts (1.25" ID) = $8.00/LF
- UG23: Directional bore 5 ducts (1.25" ID) = $9.50/LF
- UG24: Directional bore 6 ducts (1.25" ID) = $10.50/LF

Cable Pulling:
- UG4: Pull up to 144ct armored/micro cable = $0.55/LF
- UG28: Place 288-432ct armored fiber in duct = $1.00/LF

Handholes (installation cost - assign to the segment that ENDS at this handhole):
- UG10: 30x48x30 fiberglass/polycrete = $310.00/EA
- UG11: 24x36x24 fiberglass/polycrete = $110.00/EA
- UG12: Utility Box = $20.00/EA
- UG13: Ground rod 5/8" x 8' = $40.00/EA
- UG17: 17x30x18 HDPE handhole = $60.00/EA
- UG18: 24x36x18 HDPE handhole = $125.00/EA
- UG19: 30x48x18 HDPE handhole = $250.00/EA
- UG20: Terminal Box = $40.00/EA
- UG27: 30x48x24 HDPE handhole = $210.00/EA

Splicing (NOT in work order - extract splice points but do NOT include splice billing):
- Splice points are extracted for tracking only
- Do NOT add FS1, FS2, FS3, FS4 to segment work_items

HANDHOLE SIZE → TYPE MAPPING:
- 15x20x12 = Terminal Box (TB)
- 17x30x18 = HDPE Handhole (B)
- 24x36x18 = HDPE Handhole
- 24x36x24 = Fiberglass/Polycrete Handhole
- 30x48x18 = HDPE Handhole
- 30x48x24 = Large Handhole (LHH) - F1/TYCO-D butt splice location
- 30x48x30 = Large Fiberglass Handhole

SPLICE TYPE RULES (for splice_points array only):
- 15x20x12 Terminal Box → 1x4 splice
- 17x30x18 HDPE → typically 1x8 or 1x4
- 30x48x24 Large Handhole → F1 butt splice (432 fibers, up to 8 trays)

SECTION NAMING:
- Single letters (A, B, C, D, E, F) are hub/main handholes
- Numbered (A01, A02, B01) are branch handholes from that hub
- Segments connect: hub→branch (A→A01) or branch→branch (A01→A02)
- Inter-section links connect hubs: A→B, B→C, D→E, E→F

POSITION TYPE RULES:
- end-of-line: The LAST handhole in a chain (no further connections from it)
- mid-span: Has connections continuing through it

`;

  if (workOrderText && workOrderText.length > 30) {
    prompt += `\n========================================\nWORK ORDER TEXT (source of truth for billing):\n========================================\n${workOrderText}\n========================================\n\n`;
  }

  if (mapText && mapText.length > 30) {
    prompt += `\nCONSTRUCTION MAP TEXT (supplementary - images are primary for map data):\n${mapText}\n\n`;
  }

  if (hasMapImages) {
    prompt += `\nThe construction map images follow this prompt. Examine EVERY page carefully:\n- Read every handhole label\n- Read every footage number between connected handholes (small numbers along route lines)\n- Note every street name\n- Identify every section (A, B, C, D, E, F, etc.)\n- Find all inter-section links (hub-to-hub segments)\n\n`;
  }

  prompt += `REQUIRED JSON OUTPUT FORMAT:
{
  "project": {
    "customer": "string (from work order)",
    "project_name": "string (from work order)",
    "po_number": "string (from work order)",
    "total_value": number (from work order - this is the ACTUAL project value),
    "start_date": "YYYY-MM-DD",
    "completion_date": "YYYY-MM-DD",
    "rate_card_id": "${rateCardId || 'vexus-la-tx-2026'}"
  },
  "work_order_line_items": [
    { "code": "UG1", "description": "Directional bore 1-4 ducts", "qty": number, "uom": "LF", "rate": number, "total": number }
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

IMPORTANT NOTES:
1. "grand_total" should be the sum of all segment total_values. It will NOT match the work order total_value because splicing is separate.
2. Include EVERY segment visible on the map - do not skip any.
3. Read footage numbers EXACTLY from the map - do not estimate.
4. Include handhole installation costs (UG10-UG27) in the segment work_items for the segment that TERMINATES at that handhole.
5. splice_points do NOT have work_items - they are for tracking only.
6. The work_order_line_items array captures the raw line items from the work order for reference.

Return ONLY the JSON object. No markdown, no explanation, no commentary.`;

  return prompt;
}
