/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 2.6.0
 * Updated: 2026-02-03
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Opus 4 Vision API.
 * 
 * v2.6.0: Enabled Fluid Compute (300s maxDuration) - eliminates 504 timeouts.
 *         Reduced max images to 6 (2 WO + 4 map) for faster processing.
 *         Kept max_tokens at 8192 with JSON repair for any truncation.
 *         Added AbortController with 280s safety timeout.
 * v2.5.0: Fixed truncated JSON - increased max_tokens to 16384 (was 8192),
 *         added JSON repair for truncated responses, log stop_reason.
 * v2.4.0: Fixed content extraction for Opus 4 vision - handles thinking blocks
 *         and multi-block responses. Only text blocks are now used for JSON.
 * v2.3.0: Fixed JSON parsing - robust extraction handles preamble text.
 * v2.2.0: Fixed 504 timeout - increased maxDuration to 120s (Pro plan).
 * v2.1.0: Upgraded to Claude Opus 4 for superior vision accuracy.
 *         Falls back to text if images not provided.
 * 
 * POST /api/pdf-import
 * Body: { 
 *   work_order_text, work_order_images[], 
 *   map_text, map_images[],
 *   rate_card_id 
 * }
 * 
 * Environment variable required: ANTHROPIC_API_KEY
 * Requires: Fluid Compute enabled in vercel.json ("fluid": true)
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

    // Limit images to keep Opus fast - 2 WO + 4 map = 6 total
    const MAX_TOTAL_IMAGES = 6;
    let woImgs = work_order_images || [];
    let mapImgs = map_images || [];
    
    if (woImgs.length + mapImgs.length > MAX_TOTAL_IMAGES) {
      const woAlloc = Math.min(woImgs.length, 2);
      const mapAlloc = Math.min(mapImgs.length, MAX_TOTAL_IMAGES - woAlloc);
      woImgs = woImgs.slice(0, woAlloc);
      mapImgs = mapImgs.slice(0, mapAlloc);
      console.log(`Image limit: ${woAlloc} WO + ${mapAlloc} map = ${woAlloc + mapAlloc} total (was ${(work_order_images||[]).length + (map_images||[]).length})`);
    }

    const hasText = (work_order_text && work_order_text.length > 30) || (map_text && map_text.length > 30);
    const hasImages = woImgs.length > 0 || mapImgs.length > 0;

    if (!hasText && !hasImages) {
      return res.status(400).json({ error: 'No extractable content. Upload a PDF with text or images.' });
    }

    // Build message content array (text + images)
    const contentBlocks = [];

    contentBlocks.push({
      type: 'text',
      text: buildExtractionPrompt(work_order_text, map_text, rate_card_id, hasImages),
    });

    if (woImgs.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- WORK ORDER PDF PAGES (${woImgs.length} pages) ---\nExamine each page image below for project details, PO numbers, unit codes, quantities, rates, dates.`,
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
        text: `\n--- CONSTRUCTION MAP PDF PAGES (${mapImgs.length} pages) ---\nExamine each map page carefully for handhole labels, footage numbers, street names, handhole sizes, splice markers, and section boundaries.`,
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

    // Safety timeout at 280s (Vercel Fluid allows 300s)
    const controller = new AbortController();
    const safetyTimer = setTimeout(() => controller.abort(), 280000);

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
          max_tokens: 8192,
          system: 'You are a fiber optic construction data extraction specialist. Return ONLY a valid JSON object. No text before or after. No markdown. Start with { and end with }. Be concise - use short street names, skip unnecessary fields if unknown.',
          messages: [{ role: 'user', content: contentBlocks }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(safetyTimer);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'AI processing timed out after 280s. Try uploading fewer pages.' });
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
    
    // Extract text from response - handle thinking blocks, multiple text blocks
    let rawText = '';
    if (data.content && Array.isArray(data.content)) {
      rawText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
    } else if (data.content?.[0]?.text) {
      rawText = data.content[0].text;
    }
    
    console.log(`Response: ${data.content?.length || 0} blocks, text length: ${rawText.length}, model: ${data.model || 'unknown'}, stop: ${data.stop_reason || 'unknown'}`);
    
    if (data.stop_reason === 'max_tokens') {
      console.warn('Response truncated (hit max_tokens). Will attempt JSON repair.');
    }

    // Parse JSON from response with multiple fallback strategies
    let extracted = null;
    
    // Strategy 1: Direct parse (handles clean JSON responses)
    try {
      let cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
      }
      extracted = JSON.parse(cleaned);
    } catch (e1) {
      // Strategy 2: Brace extraction (handles text preamble)
      try {
        const braceStart = rawText.indexOf('{');
        const braceEnd = rawText.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd > braceStart) {
          extracted = JSON.parse(rawText.substring(braceStart, braceEnd + 1));
          console.log('Recovered JSON via brace extraction');
        }
      } catch (e2) {
        // Strategy 3: JSON repair for truncated responses
        try {
          extracted = repairTruncatedJSON(rawText);
          if (extracted) console.log('Recovered JSON via repair');
        } catch (e3) {
          console.error('All JSON parse strategies failed');
          console.error('Raw text preview:', rawText.substring(0, 500));
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
 * Attempt to repair truncated JSON (from max_tokens cutoff)
 */
function repairTruncatedJSON(rawText) {
  let truncated = rawText.substring(rawText.indexOf('{'));
  if (!truncated || truncated.length < 10) return null;
  
  // Count unclosed structures
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
  
  // If balanced already, try direct parse
  if (braces === 0 && brackets === 0 && !inString) {
    return JSON.parse(truncated);
  }
  
  // Close open string
  if (inString) truncated += '"';
  
  // Remove trailing partial values
  truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*[^,\]\}]*$/, '');
  truncated = truncated.replace(/,\s*\{[^\}]*$/, '');
  truncated = truncated.replace(/,\s*\[[^\]]*$/, '');
  truncated = truncated.replace(/,\s*$/, '');
  
  // Close unclosed brackets then braces
  for (let i = 0; i < brackets; i++) truncated += ']';
  for (let i = 0; i < braces; i++) truncated += '}';
  
  console.log(`JSON repair: closed ${braces} braces, ${brackets} brackets`);
  return JSON.parse(truncated);
}

function buildExtractionPrompt(workOrderText, mapText, rateCardId, hasImages) {
  let prompt = `Extract structured project data from these fiber optic construction documents. Return ONLY valid JSON.

RATE CARD: ${rateCardId || 'vexus-la-tx-2026'}

BILLING RATES:
- UG1: Directional bore 1-4 ducts = $8.00/LF
- UG4: Pull up to 144ct cable = $0.55/LF
- UG28: Place 288-432ct fiber = $1.00/LF
- FS1: Fusion splice 1 fiber = $16.50/EA
- FS2: Ring cut (mid-span) = $275.00/EA
- FS3: Test fiber = $6.60/EA
- FS4: ReEnter/Install Enclosure (end-of-line) = $137.50/EA
- UG10: 30x48x30 HH = $310/EA | UG17: 17x30x18 = $60/EA | UG20: TB = $40/EA | UG27: 30x48x24 = $210/EA

HANDHOLE TYPES: 15x20x12=TB (1x4) | 17x30x18=HDPE (1x4/1x8) | 30x48x24=LHH (F1/TYCO-D)
SPLICES: 1x4=2 fibers,1 tray | 1x8=2 fibers,1 tray | F1/TYCO-D=432 fibers,up to 8 trays
SECTIONS: Single letters (A,B,C)=hub handholes | Numbered (A01,A02)=branch handholes
`;

  if (hasImages) {
    prompt += `\nExamine the PDF page images below carefully. Construction maps are engineering drawings - look for handhole labels, footage numbers between nodes, street names, splice markers.\n`;
  }

  if (workOrderText && workOrderText.length > 30) {
    prompt += `\nWORK ORDER TEXT:\n${workOrderText}\n`;
  }

  if (mapText && mapText.length > 30) {
    prompt += `\nMAP TEXT:\n${mapText}\n`;
  }

  prompt += `
REQUIRED JSON FORMAT:
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
      "location": "Handhole A01",
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

Return ONLY the JSON object. No markdown, no explanation.`;

  return prompt;
}
