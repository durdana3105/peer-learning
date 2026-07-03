/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { env } from "@/env";
import { sanitizeNotificationActionUrl } from "./actionUrl";

const VAPID_PUBLIC_KEY = env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isBrowserNotificationSupported() {
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function showBrowserNotification(title: string, body: string, actionUrl = "/notifications") {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: sanitizeNotificationActionUrl(actionUrl) },
    });
    return;
  }

  new Notification(title, { body });
}

export async function registerBrowserPush(userId: string) {
  if (!isBrowserNotificationSupported() || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" as const };
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return { ok: false, reason: "permission-denied" as const };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  if (!VAPID_PUBLIC_KEY) {
    return { ok: true, reason: "permission-only" as const };
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const payload = subscription.toJSON();

  const { error } = await (supabase as any).from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: payload.endpoint,
    p256dh: payload.keys?.p256dh,
    auth: payload.keys?.auth,
  });

  if (error) {
    console.error("Failed to save push subscription:", error);
    return { ok: false, reason: "database-error" as const };
  }

  return { ok: true, reason: "subscribed" as const };
}

