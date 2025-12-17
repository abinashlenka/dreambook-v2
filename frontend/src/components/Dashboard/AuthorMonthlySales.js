import React from "react";

const AuthorMonthlySales = ({ monthlySales }) => {
  if (!monthlySales) return null;

  const {
    totalBooks = 0,
    totalSales = 0,
    totalRoyalty = "₹0.00",
    pending = { totalQty: 0, totalRoyalty: "₹0.00" },
    returned = { totalQty: 0, totalRoyalty: "₹0.00" },
  } = monthlySales;

  const stats = [
    { title: "Total Books", value: totalBooks, icon: "📚", bg: "from-purple-500 to-pink-500" },
    { title: "Total Sales", value: totalSales, icon: "📈", bg: "from-blue-500 to-indigo-500" },
    { title: "Total Royalty", value: totalRoyalty, icon: "👑", bg: "from-orange-500 to-red-500" },
    { title: "Pending Orders", value: `${pending.totalQty} orders`, sub: pending.totalRoyalty, icon: "⏳", bg: "from-yellow-400 to-orange-400" },
    { title: "Returned Orders", value: `${returned.totalQty} orders`, sub: returned.totalRoyalty, icon: "↩️", bg: "from-gray-400 to-gray-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300`}
        >
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 bg-gradient-to-br ${stat.bg}`}>
            <span className="text-white text-xl">{stat.icon}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{stat.title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          {stat.sub && <p className="text-sm text-gray-500 mt-1">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
};

export default AuthorMonthlySales;
