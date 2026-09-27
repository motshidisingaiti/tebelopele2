const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../data/store');
const { getAssistantResponse } = require('../services/aiService');

const router = express.Router();
const conversations = collection('conversations');
const escalations = collection('escalations');

function getOrCreateConversation(sessionId, channel, clientPhone) {
  let convo = conversations.find((c) => c.id === sessionId);
  if (!convo) {
    convo = conversations.insert({
      id: sessionId || uuid(),
      channel: channel || 'web',
      clientPhone: clientPhone || null,
      messages: [],
      status: 'open', // open | escalated | closed
      createdAt: new Date().toISOString(),
    });
  }
  return convo;
}

// POST /api/chat/message
// body: { sessionId?, channel?: 'web'|'whatsapp', clientPhone?, message }
router.post('/message', async (req, res) => {
  const { sessionId, channel, clientPhone, message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const convo = getOrCreateConversation(sessionId, channel, clientPhone);
  const history = convo.messages.map((m) => ({ role: m.role, content: m.content }));

  const result = await getAssistantResponse(message, history);

  const updatedMessages = [
    ...convo.messages,
    { role: 'user', content: message, at: new Date().toISOString() },
    { role: 'assistant', content: result.reply, intent: result.intent, at: new Date().toISOString() },
  ];

  const patch = { messages: updatedMessages };
  if (result.escalate) patch.status = 'escalated';

  const saved = conversations.update(convo.id, patch) || { ...convo, ...patch };

  if (result.escalate) {
    escalations.insert({
      id: uuid(),
      conversationId: saved.id,
      reason: result.topic || 'assistant_escalation',
      status: 'pending', // pending | claimed | resolved
      createdAt: new Date().toISOString(),
    });
  }

  return res.json({
    sessionId: saved.id,
    reply: result.reply,
    intent: result.intent,
    escalated: !!result.escalate,
    topic: result.topic || null,
  });
});

// GET /api/chat/session/:id — retrieve a conversation (staff/admin use)
router.get('/session/:id', (req, res) => {
  const convo = conversations.find((c) => c.id === req.params.id);
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });
  return res.json(convo);
});

module.exports = router;
