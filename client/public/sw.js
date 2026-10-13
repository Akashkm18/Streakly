// Ember Service Worker for PWA and Push Notifications
const CACHE_NAME = 'ember-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || '🔥 Ember Streak Tracker';
    const options = {
      body: data.body || 'Keep your flame alive!',
      icon: '/icons/flame.png',
      badge: '/icons/flame.png',
      data: { url: data.url || '/dashboard' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error handling push:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
