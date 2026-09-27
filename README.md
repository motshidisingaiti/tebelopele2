# Tebelopele Connect — Backend

API for the AI-enabled digital health and client engagement platform: conversational
assistant, appointment booking, health education content, referrals, human escalation,
WhatsApp integration, and the admin portal's data and auth.

## Stack

- Node.js + Express
- JSON-file datastore (`src/data/db.json`) — zero setup for a demo/pilot; swap
  `src/data/store.js` for a real database (Postgres, MySQL) before production without
  touching the routes
- Claude (Anthropic API) for the conversational assistant, with a rule-based fallback
  when no API key is configured, so the whole platform runs offline out of the box
- WhatsApp Business Cloud API, with a simulated (logged) send mode when no WhatsApp
  credentials are configured

## Setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum set JWT_SECRET
npm start
```

The server seeds an admin account, a small health-education library, and a week of
open appointment slots on first run (see `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
in `.env`).

Runs on `http://localhost:4000` by default. Check `GET /api/health`.

## Turning on live AI and WhatsApp

- **Claude**: set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) in `.env`.
  Without it, `src/services/aiService.js` uses keyword-based routing instead — same
  response shape, so nothing downstream changes.
- **WhatsApp**: set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
  `WHATSAPP_VERIFY_TOKEN` in `.env`, then point your WhatsApp Business app's webhook
  at `POST /api/webhooks/whatsapp` (and verify with the matching `GET`). Without
  credentials, outbound messages are logged instead of sent.

## API summary

| Area | Endpoint | Auth |
|---|---|---|
| Health check | `GET /api/health` | none |
| Login | `POST /api/auth/login` | none |
| Chat | `POST /api/chat/message` | none (client-facing) |
| Chat | `GET /api/chat/session/:id` | none* |
| Appointments | `GET /api/appointments/slots` | none |
| Appointments | `POST /api/appointments/:id/book` | none |
| Appointments | `PATCH /api/appointments/:id` | none |
| Appointments | `GET /api/appointments` | staff/counsellor/admin |
| Content | `GET /api/content`, `GET /api/content/:id` | none |
| Content | `POST /api/content`, `PATCH /api/content/:id` | staff/admin |
| Referrals | `POST /api/referrals` | none |
| Referrals | `GET /api/referrals`, `PATCH /api/referrals/:id` | staff/counsellor/admin |
| Escalations | `GET /api/escalations`, `PATCH /api/escalations/:id` | staff/counsellor/admin |
| WhatsApp webhook | `GET`/`POST /api/webhooks/whatsapp` | Meta signature (verify token) |
| Analytics | `GET /api/analytics/overview`, `GET /api/analytics/conversations-by-day` | staff/admin |

\* Session lookup has no auth check in this build since it's read by the assistant
itself; restrict it to staff roles before exposing the API publicly.

For staff-only routes, send `Authorization: Bearer <token>` using the token from
`POST /api/auth/login`.

## Example: a booking conversation

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to book an HIV test"}'

curl "http://localhost:4000/api/appointments/slots?service=HIV%20Testing"

curl -X POST http://localhost:4000/api/appointments/<slot-id>/book \
  -H "Content-Type: application/json" \
  -d '{"name": "Kagiso", "phone": "+26771234567"}'
```

## Notes for a production rollout

- Replace the JSON datastore with a managed database and add migrations.
- Move reminder sending (`src/services/notificationService.js`) onto a scheduler
  (cron job or queue) that scans upcoming appointments, rather than calling it
  directly.
- Add rate limiting and request logging in front of the public endpoints.
- Add audit logging for staff actions on client data, per the Data Protection Act
  requirements noted in the RFP.
