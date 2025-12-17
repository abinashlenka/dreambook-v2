import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import axios from "axios";

export default function NotificationBell({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (role) {
      axios
        .get(`/api/notifications?role=${role}`)
        .then((res) => setNotifications(res.data.data || []))
        .catch(() => setNotifications([]));
    }
  }, [role]);

  

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="w-6 h-6 text-gray-800" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 p-2">
          <h4 className="text-sm font-semibold mb-2 px-2">Notifications</h4>
          {notifications.length === 0 ? (
            <p className="text-sm px-2 text-gray-500">No new notifications</p>
          ) : (
            notifications.map((n, idx) => (
              <div key={idx} className="border-b px-2 py-1 text-sm text-gray-700">
                {n.message}
                <div className="text-xs text-gray-400">{n.date}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
