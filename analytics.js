const express = require('express');
const { collection } = require('../data/store');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const conversations = collection('conversations');
const appointments = collection('appointments');
const escalations = collection('escalations');
const notifications = collection('notifications');
const referrals = collection('referrals');

// GET /api/analytics/overview — the KPIs shown on the admin dashboard
router.get('/overview', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const allConvos = conversations.all();
  const allAppointments = appointments.all();
  const allEscalations = escalations.all();
  const allNotifications = notifications.all();
  const allReferrals = referrals.all();

  const sent = allNotifications.filter((n) => n.status === 'sent').length;
  const reminderDeliveryRate = allNotifications.length
    ? Math.round((sent / allNotifications.length) * 100)
    : null;

  return res.json({
    conversations: allConvos.length,
    appointmentsBooked: allAppointments.filter((a) => a.status === 'booked' || a.status === 'completed').length,
    escalations: allEscalations.length,
    escalationsPending: allEscalations.filter((e) => e.status === 'pending').length,
    referralsOpen: allReferrals.filter((r) => r.status === 'open').length,
    reminderDeliveryRatePct: reminderDeliveryRate,
  });
});

// GET /api/analytics/conversations-by-day — for the trend chart
router.get('/conversations-by-day', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const counts = {};
  conversations.all().forEach((c) => {
    const day = c.createdAt.slice(0, 10);
    counts[day] = (counts[day] || 0) + 1;
  });
  const series = Object.entries(counts)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
  return res.json(series);
});

module.exports = router;
