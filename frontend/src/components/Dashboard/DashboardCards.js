import React from "react";

const DashboardCards = ({ cards }) => {
  // Dynamic grid classes based on card count
  const getGridClasses = () => {
    const count = cards.length;
    if (count <= 2) return "grid-cols-1 sm:grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  };

  return (
    <div className={`grid gap-4 ${getGridClasses()}`}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg p-6 shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <span className="text-xl">{card.icon}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {card.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            {card.sub && (
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
