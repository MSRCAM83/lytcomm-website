/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 2.7.0
 * Updated: 2026-02-03
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4 Vision API.
 * 
 * v2.7.0: Full data - restored 10 images, 16384 max_tokens, 750s safety timeout.
 *         Fluid Compute (800s maxDuration) means no more 504s.
 *         Opus gets ALL the data and ALL the time it needs.
 * v2.6.0: Enabled Fluid Compute, reduced images to 6.
 * v2.5.0: JSON repair for truncated responses.
 * v2.4.0: Fixed thinking block handling.
 * v2.3.0: Robust JSON parsing.
 * v2.2.0: 120s timeout (insufficient).
 * v2.1.0: Upgraded to Opus 4.
 * 
 * POST /api/pdf-import
 * Body: { 
 *   work_order_text, work_order_images[], 
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
      work_order_text, work_order_images,
      map_text, map_images,
      rate_card_id 
    } = req.body;

    // Send all data - Fluid Compute gives us 800s, no need to cut corners
    const MAX_TOTAL_IMAGES = 10;
    let woImgs = work_order_images || [];
    let mapImgs = map_images || [];
    
    if (woImgs.length + mapImgs.length > MAX_TOTAL_IMAGES) {
      // Prioritize map pages (construction data), then work order
      const mapAlloc = Math.min(mapImgs.length, 7);
      const woAlloc = Math.min(woImgs.length, MAX_TOTAL_IMAGES - mapAlloc);
      woImgs = woImgs.slice(0, woAlloc);
      mapImgs = mapImgs.slice(0, mapAlloc);
      console.log(`Image limit: ${woAlloc} WO + ${mapAlloc} map = ${woAlloc + mapAlloc} total (was ${(work_order_images||[]).length + (map_images||[]).length})`);
    }

    const hasText = (work_order_text && work_order_text.length > 30) || (map_text && map_text.length > 30);
    const hasImages = woImgs.length > 0 || mapImgs.length > 0;

    if (!hasText && !hasImages) {
      return res.status(400).json({ error: 'No extractable content. Upload a PDF with text or images.' });
    }

    console.log(`Processing: ${woImgs.length} WO images + ${mapImgs.length} map images, text: WO=${(work_order_text||'').length} chars, map=${(map_text||'').length} chars`);

    // Build message content array
    const contentBlocks = [];

    contentBlocks.push({
      type: 'text',
      text: buildExtractionPrompt(work_order_text, map_text, rate_card_id, hasImages),
    });

    if (woImgs.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- WORK ORDER PDF PAGES (${woImgs.length} pages) ---\nExamine each page image below carefully for project details, PO numbers, unit codes, quantities, rates, dates.`,
      });
      for (let i = 0; i < woImgs.length; i++) {
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: woImgs[i],
          },
        });
      }
    }

    if (mapImgs.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- CONSTRUCTION MAP PDF PAGES (${mapImgs.length} pages) ---\nExamine each map page carefully. Look for:\n- Handhole labels (A, A01, A02, B, B01, etc.)\n- Footage numbers along fiber routes between handholes\n- Street names\n- Handhole sizes (15x20x12, 17x30x18, 30x48x24)\n- Splice/terminal markers (TYCO-D, 1x4, 1x8 symbols)\n- Section boundaries`,
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
          model: 'claude-opus-4-20250514',
          max_tokens: 16384,
          system: 'You are a fiber optic construction data extraction specialist. You extract structured data from construction maps, engineering drawings, and work orders. CRITICAL: Your entire response must be a single valid JSON object. Do not include ANY text before or after the JSON. No greetings, no explanations, no markdown fences, no commentary. Start your response with { and end with }.',
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
      console.warn('Response truncated (hit max_tokens). Will attempt JSON repair.');
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
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*[^,\]\}]*$/, '');
  truncated = truncated.replace(/,\s*\{[^\}]*$/, '');
  truncated = truncated.replace(/,\s*\[[^\]]*$/, '');
  truncated = truncated.replace(/,\s*$/, '');
  
  for (let i = 0; i < brackets; i++) truncated += ']';
  for (let i = 0; i < braces; i++) truncated += '}';
  
  console.log(`JSON repair: closed ${braces} braces, ${brackets} brackets`);
  return JSON.parse(truncated);
}

function buildExtractionPrompt(workOrderText, mapText, rateCardId, hasImages) {
  let prompt = `Extract structured project data from the following fiber optic construction documents. Return ONLY valid JSON with no other text.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

BILLING RATES (Vexus LA/TX 2026):
- UG1: Directional bore 1-4 ducts = $8.00/LF
- UG23: Directional bore 5 ducts = $9.50/LF
- UG24: Directional bore 6 ducts = $10.50/LF
- UG4: Pull up to 144ct cable = $0.55/LF
- UG28: Place 288-432ct fiber = $1.00/LF
- FS1: Fusion splice 1 fiber = $16.50/EA
- FS2: Ring cut (mid-span) = $275.00/EA
- FS3: Test fiber = $6.60/EA
- FS4: ReEnter/Install Enclosure (end-of-line) = $137.50/EA
- UG10: 30x48x30 handhole = $310.00/EA
- UG11: 24x36x24 handhole = $110.00/EA
- UG17: 17x30x18 HDPE = $60.00/EA
- UG20: Terminal Box = $40.00/EA
- UG27: 30x48x24 HDPE = $210.00/EA

HANDHOLE TYPES:
- 15x20x12 = Terminal Box (TB) - typically 1x4 splice location
- 17x30x18 = HDPE Handhole (B) - medium, may have 1x4 or 1x8
- 30x48x24 = Large Handhole (LHH) - F1/TYCO-D butt splice location

SPLICE TYPES:
- 1x4 terminal: 2 fibers, 1 tray (mid-span uses FS2 ring cut, end-of-line uses FS4)
- 1x8 splitter: 2 fibers, 1 tray
- F1 butt splice: 432 fibers, up to 8 trays (always uses FS4)
- TYCO-D: Same as F1

SECTION NAMING:
- Single letters (A, B, C, D, E, F) are hub/main handholes
- Numbered (A01, A02, B01) are branch handholes from that hub
- Segments connect hub to branch or branch to branch

`;

  if (hasImages) {
    prompt += `\nIMPORTANT: I am providing page images from the PDFs below. Please examine them carefully to extract all data visually. Construction maps are engineering drawings - look for handhole labels, footage numbers between nodes, street names, and splice markers.\n`;
  }

  if (workOrderText && workOrderText.length > 30) {
    prompt += `\nWORK ORDER TEXT:\n${workOrderText}\n`;
  }

  if (mapText && mapText.length > 30) {
    prompt += `\nCONSTRUCTION MAP TEXT:\n${mapText}\n`;
  }

  prompt += `
REQUIRED JSON OUTPUT FORMAT:
{
  "project": {
    "customer": "string",
    "project_name": "string",
    "po_number": "string",
    "total_value": number,
    "start_date": "YYYY-MM-DD",
    "completion_date": "YYYY-MM-DD",
    "rate_card_id": "vexus-la-tx-2026"
  },
  "segments": [
    {
      "contractor_id": "A→A01",
      "section": "A",
      "from_handhole": "A",
      "to_handhole": "A01",
      "footage": 148,
      "from_hh_size": "17x30x18",
      "to_hh_size": "15x20x12",
      "street": "W Parish Rd",
      "work_items": [
        { "code": "UG1", "qty": 148, "rate": 8.00, "total": 1184.00 },
        { "code": "UG4", "qty": 148, "rate": 0.55, "total": 81.40 }
      ],
      "total_value": 1265.40
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
        { "code": "FS2", "qty": 1, "rate": 275.00, "total": 275.00 },
        { "code": "FS1", "qty": 2, "rate": 16.50, "total": 33.00 },
        { "code": "FS3", "qty": 8, "rate": 6.60, "total": 52.80 }
      ],
      "total_value": 360.80
    }
  ],
  "sections": ["A", "B", "C"],
  "total_footage": number,
  "total_segments": number,
  "total_splice_points": number,
  "grand_total": number
}

Return ONLY the JSON object, no markdown, no explanation.`;

  return prompt;
}
