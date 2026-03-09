import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  // VitePWA default output
  return navigator.serviceWorker.register("/sw.js");
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasVapidKey = Boolean(VAPID_PUBLIC_KEY);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setIsSupported(supported);

    if (supported && user) {
      void checkSubscription();
      return;
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function checkSubscription() {
    try {
      setLoading(true);
      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch (error) {
      console.error("Error checking subscription:", error);
      // If SW can't be registered/controlled, treat as unsupported to avoid a stuck disabled toggle.
      setIsSupported(false);
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    if (!user) return false;
    if (!VAPID_PUBLIC_KEY) return false;

    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const json = subscription.toJSON();
      await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint!,
            p256dh: json.keys!.p256dh,
            auth: json.keys!.auth,
          },
          { onConflict: "user_id" },
        );

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!user) return false;

    try {
      setLoading(true);
      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();

      await supabase.from("push_subscriptions").delete().eq("user_id", user.id);

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { isSubscribed, isSupported, loading, hasVapidKey, subscribe, unsubscribe };
}
