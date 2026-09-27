const express = require('express');
const { collection } = require('../data/store');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const appointments = collection('appointments');

// GET /api/appointments/slots?service=&location=&from=&to=
// Public: lets the assistant / client list open slots to book.
router.get('/slots', (req, res) => {
  const { service, location } = req.query;
  let slots = appointments.filter((a) => a.status === 'open');

  if (service) slots = slots.filter((a) => a.service.toLowerCase() === String(service).toLowerCase());
  if (location) slots = slots.filter((a) => a.location.toLowerCase() === String(location).toLowerCase());

  slots = slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 20);
  return res.json(slots);
});

// POST /api/appointments/:id/book
// Public (reached via the assistant or web widget): books an open slot.
// body: { name, phone }
router.post('/:id/book', (req, res) => {
  const { name, phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required to book' });

  const slot = appointments.find((a) => a.id === req.params.id);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });
  if (slot.status !== 'open') return res.status(409).json({ error: 'Slot is no longer available' });

  const updated = appointments.update(slot.id, {
    status: 'booked',
    client: { name: name || null, phone },
  });

  return res.status(201).json(updated);
});

// PATCH /api/appointments/:id — reschedule or cancel
// body: { status?: 'cancelled', startTime? }
router.patch('/:id', (req, res) => {
  const existing = appointments.find((a) => a.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });

  const { status, startTime } = req.body || {};
  const patch = {};
  if (status) patch.status = status;
  if (startTime) patch.startTime = startTime;

  const updated = appointments.update(existing.id, patch);
  return res.json(updated);
});

// GET /api/appointments — staff/admin list view, requires auth
router.get('/', requireAuth, requireRole('admin', 'staff', 'counsellor'), (req, res) => {
  const { status } = req.query;
  let list = appointments.all();
  if (status) list = list.filter((a) => a.status === status);
  list = list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return res.json(list);
});

module.exports = router;
