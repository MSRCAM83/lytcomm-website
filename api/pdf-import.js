/**
 * LYT Communications - PDF Import API
 * Version: 1.0.0
 * Created: 2026-02-02
 * Endpoint: /api/pdf-import
 * 
 * Receives PDF files (work order + construction map),
 * uses Claude to extract project metadata, segments,
 * splice points, and rate card matches.
 * 
 * Returns structured JSON matching the database schema.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const PDF_EXTRACTION_PROMPT = `You are a fiber optic construction project data extractor for LYT Communications. Extract structured data from the provided work order and/or construction map content.

WORK ORDER EXTRACTION - Look for:
- Project number/ID, name, customer name
- PO number and total contract value
- Unit codes with quantities, rates, and extended amounts
- Start date and completion/end date
- Materials list if present
- Any special instructions or notes

MAP EXTRACTION - Look for:
- Handhole locations and IDs (labeled as letters/numbers like A, A01, A02, B, B01, etc.)
- Segment footage (numbers along fiber route lines, usually in LF)
- Splice point locations (TYCO-D markers, 1x4 terminal symbols, 1x8 splitter symbols)
- Handhole types by size notation: 
  * 15x20x12 = Terminal Box (TB) - small, for 1x4/1x8 terminals
  * 17x30x18 = HDPE handhole (B) - medium, section hubs
  * 30x48x24 = Large Handhole (LHH) - large, for F1 butt splices
- Street names along routes
- Section boundaries (usually lettered A, B, C, D, E, F)
- Utility crossing marks
- Cable types and fiber counts

ID GENERATION RULES:
- Project ID format: {3-letter-customer}-{market-code}-{build-number}
  Example: VXS-SLPH01-006
- Segment ID format: {project_id}-{section}-{to_handhole}
  Example: VXS-SLPH01-006-A-A01 (segment from A to A01)
- Contractor ID format: {from}→{to}
  Example: A→A01
- Splice ID format: {project_id}-SPL-{handhole_id}
  Example: VXS-SLPH01-006-SPL-A01

SPLICE BILLING RULES:
- 1x4 mid-span: FS2 ($275 ring cut) + FS1 (2 fibers × $16.50) + FS3 (8 tests × $6.60) = $360.80
- 1x4 end-of-line: FS4 ($137.50 case setup) + FS1 (2 × $16.50) + FS3 (8 × $6.60) = $223.30
- 1x8 mid-span: FS2 ($275) + FS1 (2 × $16.50) + FS3 (8 × $6.60) = $360.80
- 1x8 end-of-line: FS4 ($137.50) + FS1 (2 × $16.50) + FS3 (8 × $6.60) = $223.30  
- F1 butt splice (432ct): FS4 ($137.50) + FS1 (432 × $16.50) = $7,265.50

RESPOND ONLY WITH VALID JSON. No markdown, no explanation, no preamble. The JSON must match this schema exactly:

{
  "project": {
    "project_id": "string",
    "customer": "string",
    "project_name": "string",
    "po_number": "string",
    "total_value": number,
    "start_date": "YYYY-MM-DD",
    "completion_date": "YYYY-MM-DD",
    "rate_card_id": "string",
    "notes": "string"
  },
  "segments": [
    {
      "segment_id": "string",
      "contractor_id": "string",
      "section": "string",
      "from_handhole": "string (include size)",
      "to_handhole": "string (include size)",
      "footage": number,
      "street": "string"
    }
  ],
  "splice_points": [
    {
      "splice_id": "string",
      "contractor_id": "string",
      "location": "string",
      "handhole_type": "string",
      "splice_type": "1x4|1x8|F1|TYCO-D",
      "position_type": "mid-span|end-of-line",
      "fiber_count": number,
      "tray_count": number,
      "total_value": number
    }
  ],
  "summary": {
    "total_segments": number,
    "total_splice_points": number,
    "total_footage": number,
    "total_project_value": number,
    "sections": ["A", "B", ...],
    "extraction_confidence": "high|medium|low",
    "notes": "string - any issues or assumptions made"
  }
}`;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const { workOrderText, mapText, workOrderBase64, mapBase64, rateCardId } = req.body;

    if (!workOrderText && !mapText && !workOrderBase64 && !mapBase64) {
      return res.status(400).json({ error: 'At least one document (work order or map) is required' });
    }

    // Build content array for Claude
    const content = [];

    // Add work order content
    if (workOrderBase64) {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: workOrderBase64
        }
      });
      content.push({
        type: 'text',
        text: 'Above is the work order PDF. Extract all project metadata, unit codes, quantities, and rates.'
      });
    } else if (workOrderText) {
      content.push({
        type: 'text',
        text: `WORK ORDER CONTENT:\n${workOrderText}`
      });
    }

    // Add map content
    if (mapBase64) {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: mapBase64
        }
      });
      content.push({
        type: 'text',
        text: 'Above is the construction map PDF. Extract all handhole locations, segment footages, splice points, and street names.'
      });
    } else if (mapText) {
      content.push({
        type: 'text',
        text: `CONSTRUCTION MAP CONTENT:\n${mapText}`
      });
    }

    // Add rate card context
    if (rateCardId) {
      content.push({
        type: 'text',
        text: `Use rate card: ${rateCardId}. Extract and calculate all billing items using the rates specified in the system prompt.`
      });
    }

    content.push({
      type: 'text',
      text: 'Now extract all data and return ONLY valid JSON matching the schema. No markdown fences, no explanation.'
    });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: PDF_EXTRACTION_PROMPT,
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(502).json({ 
        error: 'PDF extraction service temporarily unavailable',
        details: response.status
      });
    }

    const data = await response.json();
    
    const rawText = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse JSON response - strip any markdown fences
    const cleanJson = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw response:', rawText.substring(0, 500));
      return res.status(422).json({
        error: 'Could not parse extraction results. The PDF may need manual review.',
        raw: rawText.substring(0, 2000)
      });
    }

    return res.status(200).json({
      success: true,
      ...parsed,
      usage: {
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0
      }
    });

  } catch (error) {
    console.error('PDF import error:', error);
    return res.status(500).json({ 
      error: 'Import failed. Please try again or upload a different format.' 
    });
  }
}

// v1.0.0
