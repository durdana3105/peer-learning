self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : {
        title: "New notification",
        body: "You have a new update.",
        action_url: "/",
      };

  event.waitUntil(
    self.registration.showNotification(data.title || "New notification", {
      body: data.body || "You have a new update.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: data.action_url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
