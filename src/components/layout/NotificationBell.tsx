import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import { useNotificationStream } from '../../hooks/useNotificationStream';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial backlog count on mount — SSE below only tells us about
  // notifications created *after* the connection opens, not what's unread
  // from before this page load.
  useEffect(() => {
    getUnreadCount().then((res) => setUnreadCount(res.data.count)).catch(() => {});
  }, []);

  // Live push: an open connection that the server writes to the instant a
  // new notification is created for this user — no polling delay.
  useNotificationStream((notification) => {
    setUnreadCount((prev) => prev + 1);
    setNotifications((prev) => [notification, ...prev]);
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await getNotifications();
        setNotifications(res.data.notifications);
      } catch {
        // Leave the previous list in place rather than showing an error in a dropdown.
      } finally {
        setLoading(false);
      }
    }
  };

  // Reading one notification clears it from the list immediately — it
  // shouldn't take "mark all read" to make a notification you already
  // looked at disappear.
  const handleNotificationClick = async (n: Notification) => {
    const wasUnread = !n.read;
    setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    setOpen(false);
    if (n.link) navigate(n.link);
    if (wasUnread) {
      try {
        await markNotificationRead(n.id);
      } catch {
        // Non-critical — worst case it shows as unread again next time the list is fetched.
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Non-critical — leave as-is, user can retry.
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        title="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition"
        style={{ backgroundColor: '#163D24' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 text-gray-800">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {notifications.some((n) => !n.read) && (
              <button onClick={handleMarkAllRead} className="text-xs hover:underline" style={{ color: '#9C7A0A' }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                    !n.read ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />}
                    <div className={!n.read ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
