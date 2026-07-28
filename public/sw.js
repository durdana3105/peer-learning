self.DEFAULT_NOTIFICATION_ACTION_URL = "/notifications";

self.sanitizeNotificationActionUrl = (value) => {
  if (typeof value !== "string") return self.DEFAULT_NOTIFICATION_ACTION_URL;

  const trimmed = value.trim();

  if (!trimmed) return self.DEFAULT_NOTIFICATION_ACTION_URL;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return self.DEFAULT_NOTIFICATION_ACTION_URL;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("/javascript:") ||
    lower.startsWith("/data:") ||
    lower.includes("\\")
  ) {
    return self.DEFAULT_NOTIFICATION_ACTION_URL;
  }

  return trimmed;
};

self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : {
        title: "New notification",
        body: "You have a new update.",
        action_url: self.DEFAULT_NOTIFICATION_ACTION_URL,
      };

  event.waitUntil(
    self.registration.showNotification(data.title || "New notification", {
      body: data.body || "You have a new update.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: self.sanitizeNotificationActionUrl(data.action_url),
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const safePath = self.sanitizeNotificationActionUrl(
    event.notification.data?.url,
  );
  const targetUrl = new URL(safePath, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            "focus" in client &&
            client.url.startsWith(self.location.origin)
          ) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        return clients.openWindow(targetUrl);
      }),
  );
});
