// components/NotificationProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket/index"; // adjust path accordingly

interface Notification {
  _id?: string;
  content: string;
  type: "message" | "join" | "leave" | "video";
  createdAt?: string;
}

interface NotificationContextType {
  addNotification: (notif: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => useContext(NotificationContext);

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [alerts, setAlerts] = useState<Notification[]>([]);

  const addNotification = (notif: Notification) => {
    setAlerts((prev) => [...prev, notif]);

    // Auto-dismiss after 5s
    setTimeout(() => {
      setAlerts((prev) => prev.slice(1));
    }, 5000);
  };

  useEffect(() => {
    socket.on("new-notification", addNotification);
    return () => {
      socket.off("new-notification", addNotification);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {alerts.map((n, i) => (
          <div key={i} className={`alert alert-${n.type}`}>
            {n.content}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;