// Minimal service worker — enables "Add to Home Screen" installability now,
// and is the hook point for push notifications later.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Pass-through fetch handler (required by install criteria in some browsers).
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'ScanNow', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: data.url || 'app.html' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'app.html';
  event.waitUntil(clients.openWindow(url));
});
