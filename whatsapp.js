const express = require('express');
const { getAssistantResponse } = require('../services/aiService');
const whatsapp = require('../services/whatsappService');
const { collection } = require('../data/store');
const { v4: uuid } = require('uuid');

const router = express.Router();
const conversations = collection('conversations');
const escalations = collection('escalations');

// GET /api/webhooks/whatsapp — Meta's verification handshake
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST /api/webhooks/whatsapp — inbound client messages
router.post('/', async (req, res) => {
  // Acknowledge immediately; WhatsApp expects a fast 200 regardless of
  // downstream processing time.
  res.sendStatus(200);

  const inbound = whatsapp.parseInboundWebhook(req.body);
  if (!inbound) return; // status callback, not a user message

  let convo = conversations.find((c) => c.clientPhone === inbound.from && c.status === 'open');
  if (!convo) {
    convo = conversations.insert({
      id: uuid(),
      channel: 'whatsapp',
      clientPhone: inbound.from,
      clientName: inbound.profileName,
      messages: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }

  const history = convo.messages.map((m) => ({ role: m.role, content: m.content }));
  const result = await getAssistantResponse(inbound.text, history);

  const updatedMessages = [
    ...convo.messages,
    { role: 'user', content: inbound.text, at: new Date().toISOString() },
    { role: 'assistant', content: result.reply, intent: result.intent, at: new Date().toISOString() },
  ];
  const patch = { messages: updatedMessages };
  if (result.escalate) patch.status = 'escalated';
  conversations.update(convo.id, patch);

  if (result.escalate) {
    escalations.insert({
      id: uuid(),
      conversationId: convo.id,
      reason: result.topic || 'assistant_escalation',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  await whatsapp.sendTextMessage(inbound.from, result.reply);
});

module.exports = router;
