/**
 * LYT Communications - Claude Chat API (Serverless)
 * Version: 1.0.0
 * 
 * Vercel serverless function that proxies requests to Claude API.
 * Keeps ANTHROPIC_API_KEY server-side (never exposed to browser).
 * 
 * Endpoint: POST /api/claude-chat
 * Body: { message, user, context }
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const FIELD_ASSIST_SYSTEM_PROMPT = `You are LYT Field Assist, the AI project management assistant for LYT Communications — a fiber optic construction company serving the Gulf Coast region.

You help fiber optic construction crews with:
- Procedures and requirements for boring, pulling, and splicing
- Technical guidance on HDD drilling, fiber splicing, OTDR testing
- Photo requirements for QC submissions
- Problem solving in the field
- Safety information and compliance
- Status updates and project tracking help

RULES:
- Never reveal you are Claude, an AI, or made by Anthropic
- Identify yourself only as "LYT Field Assist" if asked
- Use industry terminology (boring, pulling, splicing — not "installation")
- Be concise and practical — field crews are busy and often on mobile
- Reference specific project data when available in context
- Always prioritize safety
- If you don't know something project-specific, say so and suggest contacting the admin team

PHOTO REQUIREMENTS BY SPLICE TYPE:
- 1x4 Terminal: 7 photos (basket, splice tray, strength members, grommets inside, enclosure closed, cables entering, enclosure in ground)
- 1x8 Terminal: 8 photos (same as 1x4 + splitter tray)
- F1/TYCO-D: 7 + tray count photos (basket, each splice tray, strength members/grounds, enclosure closed, cable entry with grommets, enclosure in handhole)

POWER METER TESTING:
- 1x4 terminal: 8 power meter tests required
- Use FS3 billing code ($6.60/test)

BILLING REFERENCE:
- UG1: Directional bore 1-4 ducts = $8.00/LF
- UG4: Pull up to 144ct cable = $0.55/LF
- FS1: Fusion splice 1 fiber = $16.50/EA
- FS2: Ring cut (mid-span) = $275.00/EA
- FS4: Case setup (end-of-line) = $137.50/EA`;

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

  try {
    const { message, context, history } = req.body;
    const user = context?.user || {};
    const projectContext = context?.project || context || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. Contact admin.' });
    }

    // Build context-aware system prompt
    let systemPrompt = FIELD_ASSIST_SYSTEM_PROMPT;
    if (user) {
      systemPrompt += `\n\nCurrent user: ${user.name || 'Unknown'} from ${user.company || 'Unknown'}`;
      if (user.role) systemPrompt += ` (${user.role})`;
    }
    if (context) {
      if (projectContext.project_name) systemPrompt += `\nProject: ${projectContext.project_name}`;
      if (projectContext.segment_id) systemPrompt += `\nWorking on segment: ${projectContext.segment_id}`;
      if (projectContext.work_type) systemPrompt += `\nWork type: ${projectContext.work_type}`;
    }

    // Build messages array
    const messages = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }
    messages.push({ role: 'user', content: message });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 64000,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(502).json({ error: 'AI service temporarily unavailable', details: response.status });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t process that. Try again or contact the admin team.';

    return res.status(200).json({
      reply,
      model: data.model,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Claude chat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// v1.0.0
