"use client";
import { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import { toast } from "@/Utilities/toasters";
import { assignBook, reAssignBook } from "@/services/APIs/bookAssign";

export default function AssignToModal({ bookId, onClose, empEmailData, mode = "assign",fetchBookData }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningUser, setAssigningUser] = useState(null);

  // ✅ Build user list from empEmailData
  useEffect(() => {
    async function fetchUsers() {
      try {
        const userList = empEmailData.map((email, idx) => ({
          _id: idx.toString(),
          name: email.split("@")[0],
          email,
        }));
        setUsers(userList);
      } catch (err) {
        console.error("❌ Failed to build users:", err);
        toast("Error loading employees", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [empEmailData]);

  // ✅ Assign/Reassign handler
  const handleAssign = async (user) => {
    setAssigningUser(user._id);
    try {
      let res;
      if (mode === "reassign") {
        res = await reAssignBook(bookId, user.email);
      } else {
        res = await assignBook(bookId, user.email);
      }
      if(res){
        fetchBookData()
      }

      if (res?.status) {
        toast(
          `Book ${mode === "reassign" ? "reassigned" : "assigned"} to ${user.email}`,
          "success"
        );
        onClose();
      } else {
        toast(res?.message || "Something went wrong", "error");
      }
    } catch (err) {
      console.error("❌ Assign error:", err);
      toast("Error assigning book", "error");
    } finally {
      setAssigningUser(null);
    }
  };

  // ✅ Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          {mode === "assign" ? "👤 Assign Employee" : "🔄 Re-Assign Employee"}
        </h2>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <p className="text-gray-500 text-sm">Loading employees...</p>
        ) : filteredUsers.length > 0 ? (
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {filteredUsers.map((user) => (
              <li
                key={user._id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                    {user.name.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAssign(user)}
                  disabled={assigningUser === user._id}
                  className={`px-4 py-1.5 text-xs rounded-lg text-white font-medium shadow-sm transition ${
                    assigningUser === user._id
                      ? "bg-gray-400 cursor-not-allowed"
                      : mode === "reassign"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {assigningUser === user._id
                    ? "Processing..."
                    : mode === "reassign"
                    ? "Re-Assign"
                    : "Assign"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No employees found</p>
        )}
      </div>
    </div>
  );
}
