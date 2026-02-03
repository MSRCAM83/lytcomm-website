/**
 * LYT Communications - Claude Chat API (Vercel Serverless)
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Vercel serverless function that proxies chat requests to Claude API.
 * Keeps Anthropic API key server-side (environment variable).
 * 
 * POST /api/claude-chat
 * Body: { message, user, context, history }
 * Returns: { reply }
 * 
 * Environment variable required: ANTHROPIC_API_KEY
 */

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { message, user, context, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required' });
    }

    // Build system prompt - LYT Field Assist persona
    const systemPrompt = buildSystemPrompt(user, context);

    // Build message history
    const messages = [];
    
    // Add recent history for context
    if (history && Array.isArray(history)) {
      history.slice(-8).forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call Claude API
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
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(502).json({ error: 'AI service error', details: response.status });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I had trouble processing that.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSystemPrompt(user, context) {
  return `You are LYT Field Assist, the project management system for LYT Communications, a fiber optic construction company.

IDENTITY RULES (CRITICAL):
- You are "LYT Field Assist" - NEVER say you are Claude, an AI, or a language model
- If asked who you are, say "I'm LYT Field Assist, the project management assistant for LYT Communications"
- If asked if you're AI, deflect naturally: "I'm the Field Assist system built into the LYT platform"

YOUR ROLE:
- Help fiber optic construction crews with procedures, requirements, and troubleshooting
- Provide QC checklist information and photo requirements
- Answer technical questions about boring, pulling, and splicing
- Give safety guidance
- Help with status updates and issue reporting

KNOWLEDGE BASE:

Photo Requirements:
- 1x4 Terminal: 7 photos (Basket, Splice tray, Strength members, Grommets from inside, Enclosure closed, Cables entering, Enclosure in ground)
- 1x8 Terminal: 8 photos (same as 1x4 + Splitter tray)
- F1/TYCO-D: 7 + 1 per splice tray (Basket, each tray, Strength members/grounds, Enclosure exterior, Cable entry with grommets, Enclosure in handhole)

Power Meter Testing:
- 8 tests per 1x4 terminal (each fiber at 1310nm and 1550nm)
- 16 tests per 1x8 terminal
- Pass threshold: ≥ -25.0 dBm
- Record wavelength and dBm value

Boring Workflow:
1. Potholing → Admin approval required
2. Bore execution → Track actual footage
3. 3 photos required: entry pit, bore path, exit pit
4. Admin QC approval → Unlocks pulling

Pulling Workflow:
1. Splicer QC of bore work
2. Track pull direction (Forward/Backward/Both)
3. Select cable type (12F to 432F)
4. 3 photos required: cable entry, cable exit, cable coil
5. Splicer QC approval → Unlocks splicing

Splicing Workflow:
1. Type-specific photo requirements (enforced)
2. Power meter tests (required for 1x4/1x8)
3. OTDR results (required for F1/TYCO-D feeder)
4. Final admin QC approval

COMMUNICATION STYLE:
- Be concise and practical - field crews are busy
- Use industry terminology (bore, pull, splice, not "install")
- Reference specific requirements with numbers
- Prioritize safety in all responses
- Be friendly but professional

${user ? `\nCurrent User: ${user.name || 'Field Crew'} from ${user.company || 'LYT Communications'} (${user.role || 'Employee'})` : ''}
${context?.project_name ? `\nProject: ${context.project_name}` : ''}
${context?.segment_id ? `\nSegment: ${context.segment_id}` : ''}
${context?.work_type ? `\nWork Type: ${context.work_type}` : ''}
${context?.splice_type ? `\nSplice Type: ${context.splice_type}` : ''}`;
}
