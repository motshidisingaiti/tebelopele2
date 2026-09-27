const express = require('express');
const { collection } = require('../data/store');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const escalations = collection('escalations');
const conversations = collection('conversations');

// GET /api/escalations — the "needs a human" queue for staff
router.get('/', requireAuth, requireRole('admin', 'staff', 'counsellor'), (req, res) => {
  const { status } = req.query;
  let list = escalations.all();
  if (status) list = list.filter((e) => e.status === status);

  const withContext = list.map((e) => ({
    ...e,
    conversation: conversations.find((c) => c.id === e.conversationId) || null,
  }));

  return res.json(withContext.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// PATCH /api/escalations/:id — claim or resolve
// body: { status: 'claimed'|'resolved' }
router.patch('/:id', requireAuth, requireRole('admin', 'staff', 'counsellor'), (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'claimed', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status must be pending, claimed, or resolved' });
  }
  const updated = escalations.update(req.params.id, { status, handledBy: req.user.name });
  if (!updated) return res.status(404).json({ error: 'Escalation not found' });
  return res.json(updated);
});

module.exports = router;
