import { useNotification } from '../context/NotificationContext';
import '../styles/Notifications.css';

const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' };

export default function Notifications() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification notification-${notification.type}`}>
          <div className="notification-icon">{ICONS[notification.type] || ICONS.info}</div>
          <div className="notification-content">
            <p className="notification-title">{notification.title}</p>
            {notification.message && <p className="notification-message">{notification.message}</p>}
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
