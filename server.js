require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { seed } = require('./data/seed');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const appointmentRoutes = require('./routes/appointments');
const contentRoutes = require('./routes/content');
const referralRoutes = require('./routes/referrals');
const escalationRoutes = require('./routes/escalations');
const whatsappRoutes = require('./routes/whatsapp');
const analyticsRoutes = require('./routes/analytics');

// Ensure the JSON datastore has an admin user, content library, and open
// appointment slots on first run.
seed();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tebelopele-connect-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/webhooks/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Tebelopele Connect API listening on port ${PORT}`);
});

module.exports = app;
