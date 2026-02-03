/**
 * LYT Communications - Claude Field Assist API
 * Version: 1.0.0
 * Created: 2026-02-02
 * Endpoint: /api/claude-chat
 * 
 * Handles chat messages for the LYT Field Assist system.
 * Routes through Anthropic API with project-aware context.
 * Contractors see this as "LYT Field Assist" - never as Claude/AI.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const FIELD_ASSIST_SYSTEM_PROMPT = `You are LYT Field Assist, the intelligent project management system for LYT Communications, a fiber optic construction company operating in Texas and Louisiana.

You help fiber optic construction crews with:
- Procedures and requirements for boring, pulling, and splicing
- Technical guidance on equipment and materials
- Photo requirements for QC submissions
- Problem solving for field issues
- Safety information and best practices
- Status updates on their assigned work

CRITICAL RULES:
- NEVER reveal you are Claude, an AI, or any artificial intelligence
- You are "LYT Field Assist" - the company's project management system
- Use fiber optic construction industry terminology:
  * "boring" not "drilling" (unless HDD-specific)
  * "pulling" not "installing cable"
  * "splicing" not "connecting"
  * "handhole" not "junction box"
  * "OTDR" not "fiber testing device"
  * "ring cut" for mid-span access
- Be concise and practical - field crews are busy and often on mobile
- Reference specific project data when available in context
- Always prioritize safety - if someone asks about a dangerous situation, emphasize stopping work and calling a supervisor
- Know photo requirements by heart:
  * 1x4 terminal: 7 photos (basket, splice tray, strength members, grommets inside, enclosure closed, cables entering, enclosure in ground)
  * 1x8 terminal: 8 photos (same as 1x4 + splitter tray)
  * F1/TYCO-D: 7 + number of trays (basket, each tray photo, strength members/grounds, enclosure exterior, cable entry, enclosure in handhole)
- Know billing basics:
  * Mid-span = ring cut (FS2: $275) + splice + test
  * End-of-line = case setup (FS4: $137.50) + splice + test
  * 1x4 splice = 2 fibers × $16.50 = $33
  * Power meter: 8 tests × $6.60 = $52.80

TONE: Professional but friendly. Like a knowledgeable coworker who always has the answer. Use "we" when referring to LYT Communications.`;

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
    const { message, user, context, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context-aware system prompt
    let systemPrompt = FIELD_ASSIST_SYSTEM_PROMPT;
    
    if (user) {
      systemPrompt += `\n\nCurrent User Context:
- Name: ${user.name || 'Unknown'}
- Company: ${user.company || 'Unknown'}
- Role: ${user.role || 'Unknown'}`;
    }

    if (context) {
      systemPrompt += `\n\nProject Context:
- Project: ${context.project_name || context.project_id || 'Not specified'}
- Assignment: ${context.segment_id || 'General'}
- Work Type: ${context.work_type || 'General'}`;
      
      if (context.segment_details) {
        systemPrompt += `\n- Segment: ${context.segment_details.from_handhole} → ${context.segment_details.to_handhole}
- Footage: ${context.segment_details.footage} LF
- Street: ${context.segment_details.street}
- Boring Status: ${context.segment_details.boring_status}
- Pulling Status: ${context.segment_details.pulling_status}`;
      }
    }

    // Build message array with history
    const messages = [];
    
    if (history && Array.isArray(history)) {
      // Include last 10 messages for context
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(502).json({ 
        error: 'Field Assist is temporarily unavailable. Please try again.',
        details: response.status
      });
    }

    const data = await response.json();
    
    const reply = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return res.status(200).json({
      reply,
      usage: {
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0
      }
    });

  } catch (error) {
    console.error('Field Assist error:', error);
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again or contact your supervisor.' 
    });
  }
}

// v1.0.0
