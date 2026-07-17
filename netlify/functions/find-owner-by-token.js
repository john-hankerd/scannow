// netlify/functions/find-owner-by-token.js
// Looks up who owns a QR code, for someone who has scanned it but isn't
// signed in yet. Firestore rules require auth to read the users collection
// (so a stranger can't browse profiles), which means a brand-new scanner
// can't run that lookup client-side — this function is the one narrow,
// server-side door for it, using the Admin SDK and returning only the
// handful of fields c.html needs to show before someone has an account
// (never email, birthdate, phone, or blockedUids).

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  const token = event.queryStringParameters && event.queryStringParameters.t;
  if (!token) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing token" }) };
  }

  const snap = await db.collection("users").where("qrToken", "==", token).limit(1).get();
  if (snap.empty) {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ owner: null }) };
  }

  const d = snap.docs[0];
  const data = d.data();
  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      owner: {
        uid: d.id,
        firstName: data.firstName,
        photoUrl: data.photoUrl || null,
        isMinor: !!data.isMinor,
      },
    }),
  };
};
