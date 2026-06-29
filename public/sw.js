// Minimal service worker — its only job is to turn a push event into a
// visible OS notification, and to focus/open the app when it's clicked.
// Everything else (fetching, caching) is intentionally left alone; this
// isn't a full offline-first PWA, just push delivery.

self.addEventListener('push', (event) => {
  let data = { title: 'GES Notification', body: '', link: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // If the payload isn't JSON for some reason, fall back to the defaults
    // above rather than letting the whole push event throw.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/ges-logo.png',
      badge: '/ges-logo.png',
      data: { link: data.link },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })
  );
});
