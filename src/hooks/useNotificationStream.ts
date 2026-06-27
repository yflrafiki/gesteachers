import { useEffect, useRef } from 'react';
import { API_URL } from '../api/axios';

interface StreamNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

// Opens a live connection to the notification stream and calls `onNotification`
// the instant a new one arrives — lets any page (not just the bell) react to
// live events, e.g. a list page refetching itself instead of waiting for a
// manual refresh. The callback is read via a ref so the connection doesn't
// get torn down and reopened just because the caller passed a new closure.
export const useNotificationStream = (onNotification: (n: StreamNotification) => void) => {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const source = new EventSource(`${API_URL}/api/notifications/stream?token=${token}`);
    source.onmessage = (e) => {
      try {
        callbackRef.current(JSON.parse(e.data));
      } catch {
        // Malformed event — ignore rather than crash the page.
      }
    };

    return () => source.close();
  }, []);
};
