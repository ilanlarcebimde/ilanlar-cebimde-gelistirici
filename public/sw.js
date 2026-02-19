// Service Worker: Web Push bildirimleri için
const CACHE_NAME = 'ilanlar-cebimde-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push bildirimi geldiğinde
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Yeni İlanlar', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Yeni iş ilanları yayında',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: data.url || '/aboneliklerim',
      channelSlug: data.channelSlug,
    },
    tag: data.channelSlug ? `channel-${data.channelSlug}` : 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'İlanlar Cebimde', options)
  );
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/aboneliklerim';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Açık bir pencere varsa ona odaklan
      for (const client of clientList) {
        if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      // Yoksa yeni pencere aç
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
