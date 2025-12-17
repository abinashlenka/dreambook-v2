import React, { useState, useEffect } from "react";
import { getRoyaltyDetails } from "@/services/APIs/orders";
import Button from "@/components/Button";
import { InformationCircleIcon, ChevronDownIcon, CalendarIcon } from "@heroicons/react/24/outline";

// ✅ UPDATE 1: Added Flipkart and WooCommerce support
const platformLabels = {
  amazon: "Amazon",
  dream: "DreamBook",
  woocommerce: "DreamBook",
  flipkart: "Flipkart",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const generateYears = (numYears = 10) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: numYears }, (_, i) => currentYear - i);
};

const getAvailableMonths = (year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear) {
    // Past years - all months available
    return monthNames.map((name, idx) => ({ name, value: idx + 1 }));
  } else if (year === currentYear) {
    // Current year - only months up to current month
    return monthNames.slice(0, currentMonth).map((name, idx) => ({ name, value: idx + 1 }));
  } else {
    // Future years - no months available
    return [];
  }
};

// ✅ UPDATE 2: Corrected File Paths & Added Flipkart
const getPlatformImage = (platform) => {
  if (!platform) return "/images/default-book.png";

  switch (platform.toLowerCase()) {
    case "amazon": 
      return "/images/amazon.png"; // Changed .jpg to .png
    case "dream": 
    case "woocommerce":
      return "/images/app-icon.png"; // Changed to app-icon.png
    case "flipkart": 
      return "/images/flipkart.png"; // Added Flipkart
    default: 
      return "/images/default-book.png";
  }
};

const SalesOverview = ({ data, role, openRazorpay }) => {
  const now = new Date();
  const [salesOrders, setSalesOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  console.log("salesOrders", salesOrders)
  
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [availableMonths, setAvailableMonths] = useState(getAvailableMonths(now.getFullYear()));

  // Update available months when year changes
  useEffect(() => {
    const months = getAvailableMonths(selectedYear);
    setAvailableMonths(months);
    
    // If current selected month is not available in the new year, reset to the latest available month
    if (months.length > 0 && !months.find(m => m.value === selectedMonth)) {
      setSelectedMonth(months[months.length - 1].value);
    }
  }, [selectedYear]);

  const fetchRoyaltydata = async (title, bookId, m, y) => {
    setLoading(true);
    try {
      const res = await getRoyaltyDetails(title, bookId, m, y);
      if (res?.status) setSalesOrders(res.data);
    } catch (error) {
      console.error("Error fetching royalty data:", error);
    }
    setLoading(false);
  };

  // Fetch on mount when data is available
  useEffect(() => {
    if (data?.title && data?.id) {
      fetchRoyaltydata(data.title, data.id, selectedMonth, selectedYear);
    }
  }, [data]);

  // Automatically fetch whenever month/year changes
  useEffect(() => {
    if (data?.title && data?.id) {
      fetchRoyaltydata(data.title, data.id, selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-600">
        Loading sales data...
      </div>
    );
  }

  if (!salesOrders) return null;

  const { book, platforms, summary } = salesOrders;

  // Tooltip component
  const Tooltip = ({ text, id }) => (
    tooltip === id && (
      <div className="absolute z-10 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg mt-2 w-max max-w-[220px]">
        {text}
      </div>
    )
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{book}</h2>
          <p className="text-gray-600">
            {monthNames[selectedMonth - 1]} {selectedYear} - Royalty & Earnings
          </p>
        </div>

        {/* Modern Month/Year Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Period:</span>
          </div>
          
          <div className="flex gap-2">
            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="appearance-none bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 pr-10 text-gray-700 font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 pr-10 text-gray-700 font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                {generateYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(platforms).map((platform) => {
          const p = platforms[platform];
          const toPay = (p.totalRoyalty || 0) - (p.pendingRoyalty || 0) - (p.returnedRoyalty || 0);
          const earnings = p.earnings || 0;

          return (
            <div key={platform} className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm relative">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={getPlatformImage(platform)}
                  alt={platform}
                  className="w-10 h-10 object-contain rounded"
                  onError={(e) => (e.target.style.display = "none")}
                />
                <h3 className="text-lg font-semibold">{platformLabels[platform] || platform}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Total Quantity</div>
                  <div className="text-xl font-bold text-blue-900">{p.totalQuantity}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Total Royalty</div>
                  <div className="text-xl font-bold text-green-900">₹{p.totalRoyalty}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">Royalty / Copy (set by author)</div>
                  <div className="text-xl font-bold text-purple-900">₹{p.royaltyPerCopy}</div>
                </div>

                {(role === "admin" || role === "employee") && (
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-sm text-yellow-600">Earnings</div>
                    <div className="text-xl font-bold text-yellow-900">₹{earnings}</div>
                  </div>
                )}

                {/* Pending Royalty with Tooltip */}
                <div className="bg-orange-50 p-3 rounded relative">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-orange-600 flex items-center gap-1">
                      Pending Royalty
                      <div
                        className="relative cursor-pointer"
                        onClick={() =>
                          setTooltip(tooltip === `${platform}-pending` ? null : `${platform}-pending`)
                        }
                      >
                        <InformationCircleIcon className="w-4 h-4 text-orange-500" />
                        <Tooltip
                          id={`${platform}-pending`}
                          text="Orders will be updated after 10 days of the initiation period."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-900">₹{p.pendingRoyalty}</div>
                </div>

                {/* Returns with Tooltip */}
                {p.returnedQuantity >= 0 && (
                  <div className="bg-red-50 p-3 rounded col-span-2 relative">
                    <div className="flex justify-between items-center">
                      <div className="text-red-600 flex items-center gap-1">
                        Returns: {p.returnedQuantity}
                        <div
                          className="relative cursor-pointer"
                          onClick={() =>
                            setTooltip(tooltip === `${platform}-returns` ? null : `${platform}-returns`)
                          }
                        >
                          <InformationCircleIcon className="w-4 h-4 text-red-500" />
                          <Tooltip
                            id={`${platform}-returns`}
                            text="Represents cancelled or returned orders."
                          />
                        </div>
                      </div>
                      <span className="text-red-600">-₹{p.returnedRoyalty}</span>
                    </div>
                  </div>
                )}

                {(role === "admin" || role === "employee") && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200 col-span-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold text-base">Amount to Pay:</span>
                      <span className="text-2xl font-bold text-green-900">₹{toPay}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl mt-4">
        <h3 className="text-lg font-semibold mb-4">Overall Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">Total Quantity</div>
            <div className="text-xl font-bold text-blue-900">{summary.totalQuantity}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Total Royalty</div>
            <div className="text-xl font-bold text-green-900">₹{summary.totalRoyalty}</div>
          </div>

          {(role === "admin" || role === "employee") && (
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-sm text-yellow-600">Total Earnings</div>
              <div className="text-xl font-bold text-yellow-900">₹{summary.earnings}</div>
            </div>
          )}

          {summary.returnedQuantity > 0 && (
            <div className="bg-red-50 p-3 rounded col-span-2">
              <div className="flex justify-between">
                <span className="text-red-600">Returns: {summary.returnedQuantity}</span>
                <span className="text-red-600">-₹{summary.returnedRoyalty}</span>
              </div>
            </div>
          )}

          {(role === "admin" || role === "employee") && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200 col-span-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-semibold text-base">Total Amount to Pay:</span>
                <span className="text-3xl font-bold text-green-900">₹{summary.totalRoyalty}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;