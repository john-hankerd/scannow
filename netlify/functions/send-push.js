// netlify/functions/send-push.js
// Called from the client right after a connection request, an accept, or a
// new message is written. Looks up the recipient's saved push subscription
// and sends them a notification. If they never enabled notifications (no
// subscription saved), this just quietly no-ops — it's not an error.

const webpush = require('web-push');
const admin = require('firebase-admin');

// ─── CONFIG (Environment Variables in Netlify) ──────────────────────────────
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — from web-push.generateVAPIDKeys()
// FIREBASE_SERVICE_ACCOUNT_KEY          — full JSON service account key
// ─────────────────────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}
const db = admin.firestore();

webpush.setVapidDetails(
  'mailto:john.hankerd@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: 'Invalid JSON' };
  }

  const { toUid, title, body, url } = payload;
  if (!toUid || !title) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing toUid or title' }) };
  }

  try {
    const snap = await db.collection('users').doc(toUid).get();
    const subscription = snap.exists ? snap.data().pushSubscription : null;

    if (!subscription) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ sent: false, reason: 'no subscription' }) };
    }

    await webpush.sendNotification(subscription, JSON.stringify({ title, body: body || '', url: url || 'app.html' }));
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ sent: true }) };
  } catch (err) {
    // A 404/410 from the push service means the subscription is dead (user
    // uninstalled, cleared data, etc.) - clean it up so we stop trying.
    if (err.statusCode === 404 || err.statusCode === 410) {
      await db.collection('users').doc(toUid).update({ pushSubscription: admin.firestore.FieldValue.delete() });
    }
    console.warn('Push send failed:', err.message);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ sent: false, reason: err.message }) };
  }
};
