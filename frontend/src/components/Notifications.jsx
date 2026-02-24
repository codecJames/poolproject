import { useNotification } from '../context/NotificationContext';
import '../styles/Notifications.css';

export default function Notifications() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          style={{
            background: notification.type === 'success' ? 'rgba(81, 207, 102, 0.2)' :
                       notification.type === 'error' ? 'rgba(255, 107, 107, 0.2)' :
                       notification.type === 'warning' ? 'rgba(255, 193, 7, 0.2)' :
                       'rgba(100, 108, 255, 0.2)',
            borderColor: notification.type === 'success' ? '#51cf66' :
                        notification.type === 'error' ? '#ff6b6b' :
                        notification.type === 'warning' ? '#ffc107' :
                        '#646cff',
          }}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '!'}
            {notification.type === 'info' && 'ℹ'}
          </div>
          <div className="notification-content">
            <p className="notification-title">{notification.title}</p>
            {notification.message && <p className="notification-message">{notification.message}</p>}
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
