const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../data/store');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const content = collection('content');

// GET /api/content?category= — public, used by the assistant and web portal
router.get('/', (req, res) => {
  const { category } = req.query;
  let items = content.all();
  if (category) items = items.filter((c) => c.category.toLowerCase() === String(category).toLowerCase());
  return res.json(items);
});

// GET /api/content/:id — public
router.get('/:id', (req, res) => {
  const item = content.find((c) => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  return res.json(item);
});

// POST /api/content — staff/admin only, for the content management screen
router.post('/', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const { title, category, summary, body, approvedBy } = req.body || {};
  if (!title || !category || !body) {
    return res.status(400).json({ error: 'title, category and body are required' });
  }
  const item = content.insert({
    id: uuid(),
    title,
    category,
    summary: summary || '',
    body,
    approvedBy: approvedBy || req.user.name,
    createdAt: new Date().toISOString(),
  });
  return res.status(201).json(item);
});

// PATCH /api/content/:id — staff/admin only
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const updated = content.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Content not found' });
  return res.json(updated);
});

module.exports = router;
