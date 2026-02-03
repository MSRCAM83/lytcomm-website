/**
 * LYT Communications - PDF Import API Endpoint
 * Version: 2.0.0
 * Updated: 2026-02-03
 * 
 * Vercel serverless function that processes uploaded work order
 * and construction map PDFs via Claude Vision API.
 * 
 * v2.0.0: Now accepts base64 page images for scanned/image PDFs.
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

    const hasText = (work_order_text && work_order_text.length > 30) || (map_text && map_text.length > 30);
    const hasImages = (work_order_images && work_order_images.length > 0) || (map_images && map_images.length > 0);

    if (!hasText && !hasImages) {
      return res.status(400).json({ error: 'No extractable content. Upload a PDF with text or images.' });
    }

    // Build message content array (text + images)
    const contentBlocks = [];

    // Add the extraction instructions as first text block
    contentBlocks.push({
      type: 'text',
      text: buildExtractionPrompt(work_order_text, map_text, rate_card_id, hasImages),
    });

    // Add work order images
    if (work_order_images && work_order_images.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- WORK ORDER PDF PAGES (${work_order_images.length} pages) ---\nExamine each page image below carefully for project details, PO numbers, unit codes, quantities, rates, dates.`,
      });
      for (let i = 0; i < work_order_images.length; i++) {
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: work_order_images[i],
          },
        });
      }
    }

    // Add construction map images
    if (map_images && map_images.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `\n--- CONSTRUCTION MAP PDF PAGES (${map_images.length} pages) ---\nExamine each map page carefully. Look for:\n- Handhole labels (A, A01, A02, B, B01, etc.)\n- Footage numbers along fiber routes between handholes\n- Street names\n- Handhole sizes (15x20x12, 17x30x18, 30x48x24)\n- Splice/terminal markers (TYCO-D, 1x4, 1x8 symbols)\n- Section boundaries`,
      });
      for (let i = 0; i < map_images.length; i++) {
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: map_images[i],
          },
        });
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: 'You are a fiber optic construction data extraction specialist. You can read construction maps, engineering drawings, and work orders. Extract structured JSON data accurately. Always return valid JSON. Never include markdown code fences or commentary outside the JSON.',
        messages: [{ role: 'user', content: contentBlocks }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: 'AI extraction failed', status: response.status, details: errText.substring(0, 500) });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // Parse JSON from response
    let extracted;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      console.error('Raw text (first 500 chars):', rawText.substring(0, 500));
      return res.status(200).json({
        warning: 'Could not parse AI response as JSON',
        raw_response: rawText,
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
