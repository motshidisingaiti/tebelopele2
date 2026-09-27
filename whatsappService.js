// WhatsApp Business Cloud API integration.
//
// Without WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID set, sends are
// simulated (logged) so the rest of the platform can be developed and demoed
// without a live WhatsApp Business account.

const GRAPH_VERSION = 'v20.0';

async function sendTextMessage(toPhoneNumber, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp:simulated] -> ${toPhoneNumber}: ${body}`);
    return { simulated: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhoneNumber,
        type: 'text',
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`WhatsApp send failed (${response.status}): ${errText}`);
  }

  return response.json();
}

// Parses the payload WhatsApp posts to the webhook into a simple shape.
// Returns null if the payload isn't an inbound user message (e.g. a status update).
function parseInboundWebhook(body) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  return {
    from: message.from,
    text: message.text?.body || '',
    profileName: value.contacts?.[0]?.profile?.name || null,
    messageId: message.id,
    timestamp: message.timestamp,
  };
}

module.exports = { sendTextMessage, parseInboundWebhook };
