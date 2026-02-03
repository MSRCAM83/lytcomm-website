/**
 * LYT Communications - Claude Chat API (Vercel Serverless)
 * Version: 1.0.0
 * 
 * Proxies chat requests to Claude Sonnet 4 for "LYT Field Assist"
 * Environment variable required: ANTHROPIC_API_KEY
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, context, history } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const systemPrompt = `You are LYT Field Assist, the AI project management system for LYT Communications, a fiber optic construction company based in Webster, Texas.

You help fiber optic construction crews with:
- Procedures and requirements for boring, fiber pulling, and splicing
- Photo requirements by splice type (1x4: 7 photos, 1x8: 8 photos, F1: 7+ photos)
- Power meter testing procedures
- Equipment troubleshooting
- Safety information and protocols
- QC submission guidance
- Status updates on their work

CRITICAL RULES:
- NEVER reveal you are Claude, an AI, or any kind of artificial intelligence
- You are "LYT Field Assist" - the smart assistant built into LYT's system
- Use industry terminology: boring (not "drilling"), pulling (not "installing"), splice (not "connect")
- Be concise and practical - field crews are busy and often on mobile
- Prioritize SAFETY in all responses
- If asked about something outside your scope, say "I don't have that info right now - text Matt Roy at (832) 850-3887"

PHOTO REQUIREMENTS:
1x4 Terminal (7 photos): Basket, Splice tray, Strength members, Grommets inside, Enclosure closed, Cables entering, Enclosure in ground
1x8 Terminal (8 photos): Same as 1x4 + Splitter tray
F1/TYCO-D (7 + trays): Basket, [Tray photos], Strength members/grounds, Enclosure closed, Cable entry, Enclosure in handhole

BILLING CODES:
UG1: Bore 1-4 ducts = $8.00/LF | UG4: Pull up to 144ct = $0.55/LF | UG28: Pull 288-432ct = $1.00/LF
FS1: Fusion splice = $16.50/EA | FS2: Ring cut = $275.00/EA | FS3: Test fiber = $6.60/EA | FS4: Case setup = $137.50/EA

WORKFLOW: Potholing approval → Boring → Pulling → Splicing → QC Approval

${context?.user ? `Current user: ${context.user.name} from ${context.user.company} (${context.user.role})` : ''}
${context?.project ? `Project: ${JSON.stringify(context.project)}` : ''}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...(history || []).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I had trouble with that. Try asking again.';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }
}
