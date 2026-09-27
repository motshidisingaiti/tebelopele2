require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { collection } = require('./store');

function seed() {
  const users = collection('users');
  const content = collection('content');
  const appointments = collection('appointments');

  if (users.all().length === 0) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@tebelopele.org.bw';
    const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-immediately';
    users.insert({
      id: uuid(),
      name: 'TWC Administrator',
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'admin', // admin | counsellor | staff
      createdAt: new Date().toISOString(),
    });
    console.log(`Seeded admin user: ${email}`);
  }

  if (content.all().length === 0) {
    const topics = [
      {
        title: 'HIV testing — what to expect',
        category: 'testing',
        summary: 'How TWC testing works, how long results take, and confidentiality.',
        body:
          'Testing is free, confidential, and takes about 20 minutes including pre- and ' +
          'post-test counselling. Rapid tests give a result the same day.',
      },
      {
        title: 'Starting and staying on treatment',
        category: 'treatment',
        summary: 'What antiretroviral treatment involves and how TWC supports adherence.',
        body:
          'TWC clinicians explain treatment options, side effects, and set up a follow-up ' +
          'schedule with reminders through Tebelopele Connect.',
      },
      {
        title: 'Prevention options (PrEP)',
        category: 'prevention',
        summary: 'Pre-exposure prophylaxis eligibility and how to start.',
        body:
          'PrEP is available to clients assessed as eligible during a consultation. Connect ' +
          'can book that first consultation.',
      },
    ];
    topics.forEach((t) =>
      content.insert({ id: uuid(), ...t, approvedBy: 'TWC Clinical Team', createdAt: new Date().toISOString() })
    );
    console.log(`Seeded ${topics.length} content items`);
  }

  if (appointments.all().length === 0) {
    // A handful of open slots over the next few days, at two locations.
    const locations = ['Gaborone Centre', 'Francistown Centre'];
    const services = ['HIV Testing', 'Counselling', 'Treatment Follow-up'];
    const now = new Date();
    let created = 0;
    for (let d = 1; d <= 5; d += 1) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      [9, 11, 14].forEach((hour) => {
        appointments.insert({
          id: uuid(),
          status: 'open', // open | booked | completed | cancelled
          location: locations[d % locations.length],
          service: services[hour % services.length],
          startTime: new Date(day.setHours(hour, 0, 0, 0)).toISOString(),
          client: null,
          createdAt: new Date().toISOString(),
        });
        created += 1;
      });
    }
    console.log(`Seeded ${created} open appointment slots`);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
