// Conversational assistant logic.
//
// If ANTHROPIC_API_KEY is set, messages are routed through Claude with a
// system prompt that constrains it to TWC's approved scope and returns
// structured JSON. If no key is set, a rule-based fallback keeps the demo
// fully functional offline.

const SYSTEM_PROMPT = `You are Tebelopele Connect, the digital assistant for Tebelopele Wellness \
Centre (TWC), a health organisation in Botswana. You help clients book appointments, find \
approved health education, get referrals, and reach staff. You are a navigation tool, not a \
clinician: you never diagnose, and you escalate anything urgent or clinically sensitive to a \
human immediately. Only use TWC/Ministry of Health-approved information. Reply ONLY with JSON \
of the shape: {"intent": "book_appointment|health_education|referral|escalate|smalltalk", \
"reply": "<client-facing message>", "escalate": true|false, "topic": "<optional topic keyword>"}`;

const URGENT_KEYWORDS = ['suicide', 'harm myself', 'emergency', 'overdose', 'assault', 'unsafe', 'in danger'];

function ruleBasedRespond(message) {
  const text = message.toLowerCase();

  if (URGENT_KEYWORDS.some((k) => text.includes(k))) {
    return {
      intent: 'escalate',
      reply:
        "I'm connecting you with a TWC counsellor right now — you don't need to wait. " +
        'If you are in immediate danger, please also contact local emergency services.',
      escalate: true,
      topic: 'urgent',
    };
  }

  if (/book|appointment|schedule|reschedule|cancel/.test(text)) {
    return {
      intent: 'book_appointment',
      reply: 'I can help with that. Which service is this for — testing, counselling, or treatment follow-up?',
      escalate: false,
      topic: 'appointment',
    };
  }

  if (/prep|prevention/.test(text)) {
    return {
      intent: 'health_education',
      reply: 'Here is what TWC recommends about prevention options like PrEP.',
      escalate: false,
      topic: 'prevention',
    };
  }

  if (/test|hiv test|result/.test(text)) {
    return {
      intent: 'health_education',
      reply: 'Here is what to expect from HIV testing at TWC.',
      escalate: false,
      topic: 'testing',
    };
  }

  if (/treatment|arv|medication/.test(text)) {
    return {
      intent: 'health_education',
      reply: 'Here is an overview of starting and staying on treatment.',
      escalate: false,
      topic: 'treatment',
    };
  }

  if (/refer|refer me|other clinic|specialist/.test(text)) {
    return {
      intent: 'referral',
      reply: 'I can start a referral. Could you tell me a bit more about what you need?',
      escalate: false,
      topic: 'referral',
    };
  }

  if (/staff|human|counsellor|talk to someone|person/.test(text)) {
    return {
      intent: 'escalate',
      reply: "I'll connect you with a member of staff now.",
      escalate: true,
      topic: 'human_request',
    };
  }

  return {
    intent: 'smalltalk',
    reply:
      "Dumela! I'm Tebelopele's digital assistant. I can help you book an appointment, share " +
      'health information, arrange a referral, or connect you with staff. What do you need today?',
    escalate: false,
    topic: null,
  };
}

async function respondWithClaude(message, history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');

  try {
    return JSON.parse(textBlock.text);
  } catch (err) {
    // Model didn't return clean JSON — fail closed to the rule-based path.
    throw new Error('Could not parse Claude response as JSON');
  }
}

/**
 * @param {string} message - the client's latest message
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - prior turns, oldest first
 * @returns {Promise<{intent: string, reply: string, escalate: boolean, topic: string|null}>}
 */
async function getAssistantResponse(message, history = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return ruleBasedRespond(message);
  }
  try {
    return await respondWithClaude(message, history);
  } catch (err) {
    console.error('aiService: falling back to rule-based response —', err.message);
    return ruleBasedRespond(message);
  }
}

module.exports = { getAssistantResponse, ruleBasedRespond };
