import { useState } from 'react';
import API from '../api/axios';

// VAPID public keys arrive as URL-safe base64 — the Push API wants a raw
// Uint8Array, so this is the standard conversion every web-push guide uses.
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Lets a page offer an "Enable notifications" action — subscribing is a
// deliberate user action (not done automatically on load) since requesting
// permission unprompted is exactly the kind of thing browsers warn about and
// users dismiss without reading.
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    pushSupported ? Notification.permission : 'unsupported'
  );
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async () => {
    if (!pushSupported) {
      setPermission('unsupported');
      return false;
    }

    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const { data } = await API.get('/push/public-key');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      const json = subscription.toJSON();
      await API.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
      return true;
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      return false;
    } finally {
      setSubscribing(false);
    }
  };

  return { permission, subscribing, subscribe };
};
