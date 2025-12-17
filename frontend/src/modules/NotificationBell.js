"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import {
  getUserNotification,
  markAllAsRead,
  deleteNotification,
} from "@/services/APIs/notification";
import { messaging, onMessageListener ,requestFCMToken} from "../config/firebase";

export default function NotificationBell({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const audioRef = useRef(null);

  // Load userId
  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (id) => {
    if (!id) return;
    try {
      const response = await getUserNotification(id);
      const data = Array.isArray(response) ? response : response?.data || [];
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };


  useEffect(() => {
    async function enableFCM() {
      const permission = await Notification.requestPermission();
      console.log("permission", permission)
      if (permission === "granted") {
        const token = await requestFCMToken();
        if (token && userId) {
          // Send token to backend
          await fetch(`http://localhost:5001/api/notifications/${userId}/save-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fcmToken: token }),
          });
        }
      }
    }
    enableFCM();
  }, [userId]);


  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [role, userId]);

  // 🔔 Listen for real FCM notifications
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessageListener((payload) => {
      if (payload.notification) {
        const { title, body } = payload.notification;

        setNotifications((prev) => [
          { _id: Date.now(), title, body, createdAt: new Date().toISOString() },
          ...prev,
        ]);

        // Play sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) =>
            console.warn("Audio play failed:", err)
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // // 🧪 Fake notification test (auto after 3s)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setNotifications((prev) => [
  //       {
  //         _id: Date.now(),
  //         title: "Test Alert",
  //         body: "This is a fake notification",
  //         createdAt: new Date().toISOString(),
  //       },
  //       ...prev,
  //     ]);

  //     if (audioRef.current) {
  //       audioRef.current.currentTime = 0;
  //       audioRef.current.play().catch((err) =>
  //         console.warn("Audio play failed:", err)
  //       );
  //     }
  //   }, 3000);

  //   return () => clearTimeout(timer);
  // }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Clear all
  const handleClearAll = async () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* 🔊 Hidden audio element */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />


      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="text-gray-600 dark:text-neutral-400 w-5 h-5 sm:w-6 sm:h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] sm:text-xs rounded-full min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] flex items-center justify-center font-medium">
            {notifications.length > 99 ? "99+" : notifications.length}
          </span>
        )}
      </button>

      {/* 🧪 Test Sound Button (dev only, remove in prod) */}
      {/* <button
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) =>
              console.warn("Manual play failed:", err)
            );
          }
        }}
        className="ml-3 px-2 py-1 bg-blue-500 text-white rounded text-xs"
      >
        🔊 Test Sound
      </button> */}

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 bg-white dark:bg-neutral-800 shadow-xl rounded-lg border border-gray-200 dark:border-neutral-700 z-50 w-screen max-w-[100vw] sm:w-80 sm:max-w-80 -mr-4 sm:mr-0"
            style={{ maxHeight: "calc(100vh - 100px)" }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-750 rounded-t-lg flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    {notifications.length} unread notification
                    {notifications.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={handleClearAll}
                className="text-red-600 dark:text-red-400 text-xs hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-60 sm:max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {notifications.map((n, index) => (
                    <li
                      key={n._id || index}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-750 transition-colors duration-150 flex justify-between items-start"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {n.title || "Notification"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-neutral-300 line-clamp-3">
                          {n.body || n.message || "No content available"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-neutral-500">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "Just now"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(n._id)}
                        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-gray-400 dark:text-neutral-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    No notifications yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                    You'll see new notifications here
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}




// // src/modules/NotificationBell.js
// import { useEffect, useState, useRef } from "react";
// import { Bell, X } from "lucide-react";

// export default function NotificationBell({ role }) {
//   const [notifications, setNotifications] = useState([]);
//   const [open, setOpen] = useState(false);
//   const panelRef = useRef(null);
//   const buttonRef = useRef(null);

//   const fetchNotifications = async () => {
//     try {
//       const response = await fetch(`/api/notifications?role=${role}`);
//       const json = await response.json();
//       if (json.status) {
//         setNotifications(json.data || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch notifications:", err);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();
//   }, [role]);

//   // Close when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         panelRef.current &&
//         !panelRef.current.contains(e.target) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(e.target)
//       ) {
//         setOpen(false);
//       }
//     };
//     if (open) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [open]);

//   return (
//     <div className="relative">
//       {/* Bell button */}
//       <button
//         ref={buttonRef}
//         onClick={() => setOpen((prev) => !prev)}
//         className="relative p-2 rounded-full transition"
//       >
//         <Bell className="text-white w-6 h-6" /> {/* Default white */}
//         {notifications.length > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
//             {notifications.length}
//           </span>
//         )}
//       </button>

//       {/* Notification Panel */}
//       {open && (
//         <div
//           ref={panelRef}
//           className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] sm:w-2/3 md:w-1/2 lg:w-1/3 mt-16 lg:mt-0 bg-white shadow-lg rounded-xl z-50"
//         >
//           <div className="max-w-lg mx-auto">
//             {/* Header */}
//             <div className="flex justify-between items-center px-4 py-3 border-b">
//               <h3 className="font-semibold text-gray-900">Notifications</h3>
//               <div className="flex items-center gap-3">
//                 {notifications.length > 0 && (
//                   <button
//                     className="text-xs text-blue-600 hover:underline"
//                     onClick={() => setNotifications([])}
//                   >
//                     Clear all
//                   </button>
//                 )}
//                 <button onClick={() => setOpen(false)}>
//                   <X className="w-5 h-5 text-gray-600 hover:text-gray-900" />
//                 </button>
//               </div>
//             </div>

//             {/* List */}
//             <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
//               {notifications.length === 0 ? (
//                 <li className="px-4 py-6 text-center text-sm text-gray-500">
//                   No notifications
//                 </li>
//               ) : (
//                 notifications.map((n) => (
//                   <li
//                     key={n.id}
//                     className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer"
//                   >
//                     <p className="text-gray-800">{n.message}</p>
//                     <p className="text-[11px] text-gray-400">{n.date}</p>
//                   </li>
//                 ))
//               )}
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

