// components/Book/EmployeeDetailModal.js
import React from "react";

export default function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[350px] relative">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Assigned Employee
        </h2>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-xl transition-shadow duration-200">
          {/* Circle Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {employee.name.charAt(0).toUpperCase()}
          </div>

          {/* Employee Info */}
          <div className="flex flex-col">
            <p className="text-base font-semibold text-gray-900">{employee.name}</p>
            <p className="text-sm text-gray-600">{employee.email}</p>
            <p className="text-xs text-gray-400">
              Assigned by: <span className="font-medium text-gray-700">{employee.assignedByName}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
