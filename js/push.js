import { db } from './firebase.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Same key pair as the VAPID_PUBLIC_KEY set in Netlify env vars.
const VAPID_PUBLIC_KEY = 'BE33igm1-USLi7taJrKK4xlcj7CTxWXKCHZeJvUKHUpMlDp-8E8A76RrLx52HTynwYWJeWMzJ2oZEgB42fKH-ag';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function enablePushNotifications(uid) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await updateDoc(doc(db, 'users', uid), { pushSubscription: subscription.toJSON() });
  return { ok: true };
}

// Fire-and-forget: failures here should never block the UI action that
// triggered them (sending a message shouldn't fail just because a push
// notification couldn't be delivered). Relative path so this resolves
// correctly whether the app is loaded at its own domain root or proxied
// under 40thfloor.com/scannow/.
export function notify(toUid, title, body, url) {
  fetch('.netlify/functions/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUid, title, body, url }),
  }).catch(() => {});
}
