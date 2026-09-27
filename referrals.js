const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../data/store');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const referrals = collection('referrals');

// POST /api/referrals — public, created via the assistant
// body: { clientName?, clientPhone, reason, destination? }
router.post('/', (req, res) => {
  const { clientName, clientPhone, reason, destination } = req.body || {};
  if (!clientPhone || !reason) {
    return res.status(400).json({ error: 'clientPhone and reason are required' });
  }
  const referral = referrals.insert({
    id: uuid(),
    clientName: clientName || null,
    clientPhone,
    reason,
    destination: destination || 'TWC clinical team',
    status: 'open', // open | in_progress | completed
    createdAt: new Date().toISOString(),
  });
  return res.status(201).json(referral);
});

// GET /api/referrals — staff/admin, for the referral tracking screen
router.get('/', requireAuth, requireRole('admin', 'staff', 'counsellor'), (req, res) => {
  const { status } = req.query;
  let list = referrals.all();
  if (status) list = list.filter((r) => r.status === status);
  return res.json(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// PATCH /api/referrals/:id — update status as it's followed up
router.patch('/:id', requireAuth, requireRole('admin', 'staff', 'counsellor'), (req, res) => {
  const updated = referrals.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Referral not found' });
  return res.json(updated);
});

module.exports = router;
