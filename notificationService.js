const { v4: uuid } = require('uuid');
const { collection } = require('../data/store');
const whatsapp = require('./whatsappService');

const notifications = collection('notifications');

// Logs and sends a reminder for one appointment. In production this would
// be invoked by a scheduler (cron / queue) looking ahead N hours, rather
// than called directly — see README for the suggested scheduling setup.
async function sendAppointmentReminder(appointment) {
  const phone = appointment.client?.phone;
  const message = phone
    ? `Reminder: your ${appointment.service} appointment at TWC ${appointment.location} is on ` +
      `${new Date(appointment.startTime).toLocaleString('en-GB')}. Reply CANCEL to cancel.`
    : null;

  if (phone && message) {
    await whatsapp.sendTextMessage(phone, message);
  }

  return notifications.insert({
    id: uuid(),
    type: 'appointment_reminder',
    appointmentId: appointment.id,
    channel: 'whatsapp',
    status: phone ? 'sent' : 'skipped_no_contact',
    sentAt: new Date().toISOString(),
  });
}

module.exports = { sendAppointmentReminder };
