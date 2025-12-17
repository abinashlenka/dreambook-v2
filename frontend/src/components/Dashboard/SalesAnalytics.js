import React, { useState } from "react";
import { BarChart3, BookOpen, Users, DollarSign, Package, TrendingUp, Award, ShoppingCart, ChevronDown } from "lucide-react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Tooltip from "../Tooltip";

const SalesAnalytics = ({
  selectedMonth,
  setSelectedMonth,
  allMonths,
  monthlySales,
  loading = false,
  role
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const { totalBooks, totalAuthors, platforms } = monthlySales || {
    totalBooks: 0,
    totalAuthors: 0,
    platforms: {},
  };

   const summaryStats = [
    { title: "Total Books", value: totalBooks, icon: <BookOpen className="w-6 h-6" />, bg: "from-gray-600 to-gray-700" },
    { title: "Total Authors", value: totalAuthors, icon: <Users className="w-6 h-6" />, bg: "from-gray-600 to-gray-700" },
  ].filter(stat => !(role === "author" && stat.title === "Total Authors")); // Hide for authors

  // Get formatted month display
  const getFormattedMonth = (month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setIsDropdownOpen(false);
  };


  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Sales Analytics</h2>
            <p className="text-gray-600 text-sm">Monthly performance overview</p>
          </div>
          
          {/* Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loading}
              className="min-w-[280px] px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-gray-900">
                {selectedMonth ? getFormattedMonth(selectedMonth) : "Select Month"}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {allMonths.map((month, i) => (
                  <button
                    key={i}
                    onClick={() => handleMonthSelect(month)}
                    className={`w-full px-4 py-3 text-left hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                      selectedMonth === month 
                        ? 'bg-indigo-50 text-indigo-600 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {getFormattedMonth(month)}
                  </button>
                ))}
              </div>
            )}

            {/* Backdrop to close dropdown */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Loading State */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <p className="text-gray-500 mt-4">Loading sales data...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            {summaryStats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summaryStats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Platform Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(platforms || {}).map(([platform, stats]) => (
                  <div key={platform} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold capitalize text-gray-800">{platform}</h4>
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Total Sales */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Total Sales</span>
                        <span className="font-semibold text-gray-900">{stats.totalSales}</span>
                      </div>
                      
                      {/* Total Royalty */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Total Royalty</span>
                        <span className="font-semibold text-gray-900">{stats.totalRoyalty}</span>
                      </div>
                      
                      {/* Pending with Tooltip */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600 text-sm">Pending</span>
                          <Tooltip
                            id={`${platform}-pending`}
                            text="Orders will be updated after 10 days of the initiation period."
                            position="top"
                          >
                            <InformationCircleIcon className="w-4 h-4 text-orange-500 hover:text-orange-600 transition-colors cursor-help" />
                          </Tooltip>
                        </div>
                        <span className="font-semibold text-orange-600">
                          {stats.pending?.totalQty} ({stats.pending?.totalRoyalty})
                        </span>
                      </div>
                      
                      {/* Returns with Tooltip */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 text-sm">Returned</span>
                          <Tooltip
                            id={`${platform}-returns`}
                            text="Represents cancelled or returned orders."
                            position="top"
                          >
                            <InformationCircleIcon className="w-4 h-4 text-red-500 hover:text-red-600 transition-colors cursor-help" />
                          </Tooltip>
                        </div>
                        <span className="font-semibold text-red-600">
                          {stats.returned?.totalQty} ({stats.returned?.totalRoyalty})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Empty State */}
              {(!platforms || Object.keys(platforms).length === 0) && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
                  <p className="text-gray-500 text-sm">No sales data found for the selected month.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;
