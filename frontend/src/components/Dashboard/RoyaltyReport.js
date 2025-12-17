import { useState, useEffect } from "react";
import {
  getAuthorRoyaltyReport,
  getForAllAuthorRoyaltyReport,
  markRoyaltyAsPaidForAllBooks,
  markRoyaltyAsPaidForAuthor,
  markRoyaltyAsPaidForBook
} from "../../services/APIs/dashboard";
import Loader from "@/modules/Loader";
import { ChevronDownIcon, XMarkIcon, ArrowDownTrayIcon, CheckCircleIcon, CurrencyRupeeIcon } from "@heroicons/react/24/outline";
import Image from 'next/image'

const RoyaltyReport = ({ role, authorId, isOpen, onClose }) => {
  const [reportData, setReportData] = useState([]);
  console.log("reportData", reportData)
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filter, setFilter] = useState(null);
  const [expandedAuthors, setExpandedAuthors] = useState(new Set());

  const isAuthor = role === "author";
  console.log("isAuthor", isAuthor)

  // Toggle author expansion
  const toggleAuthorExpansion = (authorId) => {
    const newExpanded = new Set(expandedAuthors);
    if (newExpanded.has(authorId)) {
      newExpanded.delete(authorId);
    } else {
      newExpanded.add(authorId);
    }
    setExpandedAuthors(newExpanded);
  };

  // Calculate total royalty to pay across all data
  const calculateTotalRoyaltyToPay = () => {
    if (!reportData || reportData.length === 0) return "₹0.00";

    if (isAuthor) {
      // For author view - sum all book royalties
      const total = reportData.reduce((sum, book) => {
        const amount = parseFloat(book.totalRoyaltyToPay?.replace('₹', '').replace(',', '') || 0);
        return sum + amount;
      }, 0);
      return `₹${total.toFixed(2)}`;
    } else {
      // For admin view - sum all author royalties
      const total = reportData.reduce((sum, author) => {
        const amount = parseFloat(author.totalRoyaltyToPay?.replace('₹', '').replace(',', '') || 0);
        return sum + amount;
      }, 0);
      return `₹${total.toFixed(2)}`;
    }
  };

  // Handle mark as paid for overall
  const handleMarkAsPaid = async () => {
    const totalAmount = calculateTotalRoyaltyToPay();
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
    const confirmMessage = `Are you sure you want to mark ${totalAmount} as paid for all authors in ${monthName} ${selectedYear}?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        const response = await markRoyaltyAsPaidForAllBooks({
          month: selectedMonth,
          year: selectedYear,
          paymentDate: new Date().toISOString()
        });

        if (response.status) {
          alert(`✅ Payment of ${totalAmount} has been marked as paid successfully for ${monthName} ${selectedYear}!`);
          // Refresh data after marking as paid
          fetchRoyaltyReport();
        } else {
          alert(`❌ Failed to mark payment as paid: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error marking payment as paid:', error);
        alert(`❌ Error marking payment as paid: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle individual book payment
  const handleBookPayment = async (book, authorName = null) => {
    const amount = book.totalRoyaltyToPay;
    const bookTitle = book.bookTitle;
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
    const confirmMessage = `Are you sure you want to mark ${amount} as paid for "${bookTitle}"${authorName ? ` by ${authorName}` : ''} for ${monthName} ${selectedYear}?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        const response = await markRoyaltyAsPaidForBook({
          bookId: book.bookId,
          month: selectedMonth,
          year: selectedYear,
          paymentDate: new Date().toISOString()
        });

        if (response.status) {
          alert(`✅ Payment of ${amount} for "${bookTitle}" has been marked as paid successfully!`);
          // Refresh data after marking as paid
          fetchRoyaltyReport();
        } else {
          alert(`❌ Failed to mark book payment as paid: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error marking book payment as paid:', error);
        alert(`❌ Error marking book payment as paid: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle individual author payment
  const handleAuthorPayment = async (author) => {
    const amount = author.totalRoyaltyToPay;
    const authorName = author.authorName;
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
    const confirmMessage = `Are you sure you want to mark ${amount} as paid for all books by ${authorName} for ${monthName} ${selectedYear}?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        const response = await markRoyaltyAsPaidForAuthor({
          authorId: author.authorId,
          month: selectedMonth,
          year: selectedYear,
          paymentDate: new Date().toISOString()
        });

        if (response.status) {
          alert(`✅ Payment of ${amount} for ${authorName} has been marked as paid successfully!`);
          // Refresh data after marking as paid
          fetchRoyaltyReport();
        } else {
          alert(`❌ Failed to mark author payment as paid: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error marking author payment as paid:', error);
        alert(`❌ Error marking author payment as paid: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  // Fetch royalty report
  const fetchRoyaltyReport = async () => {
    if (!selectedMonth || !selectedYear) return;

    try {
      setLoading(true);
      let response;

      if (isAuthor) {
        response = await getAuthorRoyaltyReport({
          month: selectedMonth,
          year: selectedYear,
          authorId: authorId
        });
      } else {
        response = await getForAllAuthorRoyaltyReport({
          month: selectedMonth,
          year: selectedYear
        });
      }

      if (response.status) {
        setReportData(response.data || []);
        setFilter(response.filter || { month: selectedMonth, year: selectedYear });
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Error fetching royalty report:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear && isOpen) {
      fetchRoyaltyReport();
    }
  }, [selectedMonth, selectedYear, isOpen]);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Download report as Excel
  const downloadReport = () => {
    if (reportData.length === 0) {
      alert("No data available to download");
      return;
    }

    let excelData = [];

    if (isAuthor) {
      // For author view - direct book data
      excelData = reportData.map((item, index) => ({
        'S.No': index + 1,
        'Book Title': item.bookTitle,
        'Book Price': item.bookPrice?.replace('₹', '') || '0',
        'Royalty Set': item.royaltySetByAuthor?.replace('₹', '') || '0',
        'Total Quantity': item.totalQuantity || 0,
        'Pending Quantity': item.pendingQuantity || 0,
        'Cancelled Quantity': item.cancelledQuantity || 0,
        'Total Royalty': item.totalRoyalty?.replace('₹', '') || '0',
        'Pending Royalty': item.pendingRoyalty?.replace('₹', '') || '0',
        'Cancelled Royalty': item.cancelledRoyalty?.replace('₹', '') || '0',
        'Total Royalty To Pay': item.totalRoyaltyToPay?.replace('₹', '') || '0',
      }));
    } else {
      // For admin/employee view - flatten author and book data
      let serialNo = 1;
      reportData.forEach(author => {
        author.books.forEach(book => {
          excelData.push({
            'S.No': serialNo++,
            'Author Name': author.authorName,
            'Author Email': author.authorEmail,
            'Book Title': book.bookTitle,
            'Book Price': book.bookPrice?.replace('₹', '') || '0',
            'Royalty Set': book.royaltySetByAuthor?.replace('₹', '') || '0',
            'Total Quantity': book.totalQuantity || 0,
            'Pending Quantity': book.pendingQuantity || 0,
            'Cancelled Quantity': book.cancelledQuantity || 0,
            'Total Royalty': book.totalRoyalty?.replace('₹', '') || '0',
            'Pending Royalty': book.pendingRoyalty?.replace('₹', '') || '0',
            'Cancelled Royalty': book.cancelledRoyalty?.replace('₹', '') || '0',
            'Total Royalty To Pay': book.totalRoyaltyToPay?.replace('₹', '') || '0',
            'Total Earnings': book.totalEarnings?.replace('₹', '') || '0'
          });
        });
      });
    }

    // Create Excel-compatible CSV with BOM for proper encoding
    const headers = Object.keys(excelData[0]);
    const csvRows = [
      headers.join(','),
      ...excelData.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Royalty_Report_${filter?.month || 'Current'}_${filter?.year || new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header with Filters */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            {/* Header Row */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {isAuthor ? "My Royalty Report" : "Authors Royalty Report"}
                </h2>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                  {isAuthor
                    ? `${reportData.length} Books Found`
                    : `${reportData.length} Authors Found`
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-indigo-200 transition-colors p-1 ml-2 flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm flex-1 min-w-[100px]"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value} className="text-gray-900">
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm flex-1 min-w-[80px]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year} className="text-gray-900">
                    {year}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchRoyaltyReport}
                className="bg-white/20 text-white px-3 py-1.5 rounded-md hover:bg-white/30 transition-colors text-xs sm:text-sm font-medium backdrop-blur-sm"
              >
                Update
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadReport()}
                disabled={reportData.length === 0}
                className="bg-white text-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex-1 justify-center"
              >
                <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Download</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-xl font-bold">
                  {isAuthor ? "My Royalty Report" : "Authors Royalty Report"}
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {isAuthor
                    ? `${reportData.length} Books Found`
                    : `${reportData.length} Authors Found`
                  }
                </p>
              </div>

              {/* Inline Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value} className="text-gray-900">
                      {month.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year} className="text-gray-900">
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchRoyaltyReport}
                  className="bg-white/20 text-white px-3 py-1.5 rounded-md hover:bg-white/30 transition-colors text-sm font-medium backdrop-blur-sm"
                >
                  Update
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadReport()}
                disabled={reportData.length === 0}
                className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-indigo-200 transition-colors p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh] bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-6">

                <Image
                  alt="App Icon"
                  src="/images/app-icon.png"
                  width={126}
                  height={56}
                  className="object-contain mx-auto"
                />

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800">DreamBook Publishing</h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Please wait while we fetch your data...
                  </p>
                </div>
              </div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500">No royalty data found for the selected period.</p>
            </div>
          ) : (
            <>
              {/* Total Royalty Section - Compact Display */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 mx-6 mt-4 mb-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CurrencyRupeeIcon className="h-8 w-8" />
                    <div>
                      <h3 className="text-sm font-medium">
                        {isAuthor ? "Total Royalty You'll Receive" : "Total Royalty to Pay"}
                      </h3>
                      <div className="text-2xl font-bold">{calculateTotalRoyaltyToPay()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">
                      {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </p>
                    {!isAuthor && (
                      <button
                        onClick={handleMarkAsPaid}
                        disabled={reportData.length === 0 || parseFloat(calculateTotalRoyaltyToPay().replace('₹', '')) === 0}
                        className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Pay All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                {isAuthor ? (
                  // Author View - Display books with comprehensive data
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Book-wise Royalty Details</h3>
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                      {reportData.map((item, index) => (
                        <div
                          key={item.bookId || index}
                          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                        >
                          {/* Book Header */}
                          <div className="mb-4">
                            <div className="mb-2" style={{ height: '3rem', display: 'flex', alignItems: 'flex-start' }}>
                              <h4 className="font-bold text-indigo-700 text-lg leading-6 line-clamp-2">
                                {item.bookTitle}
                              </h4>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>Book Price: <span className="font-semibold">{item.bookPrice}</span></span>
                              <span>Royalty Rate: <span className="font-semibold">{item.royaltySetByAuthor}</span></span>
                            </div>
                          </div>

                          {/* Royalty Amount with Payment Status - View Only for Authors */}
                          <div className={`p-3 rounded-lg mb-4 text-center ${item.isPaid
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200'
                            }`} style={{ minHeight: '80px' }}>
                            {item.isPaid ? (
                              <>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                  <span className="text-xs font-bold text-green-600">PAID</span>
                                </div>
                                <div className="text-lg font-bold text-green-600 mb-1">
                                  {item.totalRoyalty}
                                </div>
                                <div className="text-xs text-green-700 mb-1">Royalty Paid</div>
                                <div className="text-xs text-green-600">
                                  {new Date(item.lastPaymentDate).toLocaleDateString('en-IN')}
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col justify-center h-full">
                                <div className="text-xl font-bold text-indigo-600 mb-1">
                                  {item.totalRoyaltyToPay}
                                </div>
                                <div className="text-xs text-indigo-700">Royalty You'll Receive</div>
                              </div>
                            )}
                          </div>

                          {/* Comprehensive Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-center">
                              <div className="text-sm font-bold text-blue-600">{item.totalQuantity || 0}</div>
                              <div className="text-xs text-blue-700">Total Sold</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 p-2 rounded-lg text-center">
                              <div className="text-sm font-bold text-green-600">{item.confirmedQuantity || 0}</div>
                              <div className="text-xs text-green-700">Confirmed</div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg text-center">
                              <div className="text-sm font-bold text-yellow-600">{item.pendingQuantity || 0}</div>
                              <div className="text-xs text-yellow-700">Pending</div>
                            </div>
                          </div>

                          {/* Additional Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-center">
                              <div className="text-sm font-bold text-red-600">{item.cancelledQuantity || 0}</div>
                              <div className="text-xs text-red-700">Cancelled</div>
                              <div className="text-xs text-red-600 mt-1">{item.cancelledRoyalty || '₹0.00'}</div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg text-center">
                              <div className="text-sm font-bold text-orange-600">{item.totalRoyalty || '₹0.00'}</div>
                              <div className="text-xs text-orange-700">Total Royalty</div>
                            </div>
                          </div>

                          {/* Royalty Breakdown */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Total Royalty:</span>
                                <span className="font-semibold ml-2">{item.totalRoyalty || '₹0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Pending Royalty:</span>
                                <span className="font-semibold ml-2">{item.pendingRoyalty || '₹0.00'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Admin/Employee View - Modern Collapsible Author Dropdown
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Author-wise Royalty Details</h3>
                    {reportData.map((author, authorIndex) => {
                      const isExpanded = expandedAuthors.has(author.authorId);
                      return (
                        <div key={author.authorId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          {/* Collapsible Author Header */}
                          <div
                            className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100 transition-all duration-200"
                            onClick={() => toggleAuthorExpansion(author.authorId)}
                          >
                            {/* Mobile Layout */}
                            <div className="block sm:hidden">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <ChevronDownIcon
                                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                      }`}
                                  />
                                  <div>
                                    <h3 className="text-base font-bold text-gray-900">{author.authorName}</h3>
                                    <p className="text-xs text-gray-600 truncate max-w-[200px]">{author.authorEmail}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-indigo-600">{author.totalRoyaltyToPay}</div>
                                  <div className="text-xs text-gray-500">To Pay</div>
                                </div>
                              </div>

                              {/* Mobile Stats Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <div className="text-sm font-bold text-blue-600">{author.totalBooks}</div>
                                    <div className="text-xs text-gray-500">Books</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm font-bold text-green-600">{author.totalSales}</div>
                                    <div className="text-xs text-gray-500">Sales</div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuthorPayment(author);
                                  }}
                                  disabled={parseFloat(author.totalRoyaltyToPay?.replace('₹', '')) === 0}
                                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <CurrencyRupeeIcon className="h-3 w-3" />
                                  Pay
                                </button>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Expand/Collapse Icon */}
                                <div className="flex-shrink-0">
                                  <ChevronDownIcon
                                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                      }`}
                                  />
                                </div>

                                {/* Author Info */}
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">{author.authorName}</h3>
                                  <p className="text-sm text-gray-600">{author.authorEmail}</p>
                                </div>
                              </div>

                              {/* Author Summary Stats - Compact */}
                              <div className="flex items-center gap-4 lg:gap-6">
                                <div className="text-center">
                                  <div className="text-sm font-bold text-blue-600">{author.totalBooks}</div>
                                  <div className="text-xs text-gray-500">Books</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-bold text-green-600">{author.totalSales}</div>
                                  <div className="text-xs text-gray-500">Sales</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-indigo-600">{author.totalRoyaltyToPay}</div>
                                  <div className="text-xs text-gray-500">To Pay</div>
                                </div>

                                {/* Pay Author Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuthorPayment(author);
                                  }}
                                  disabled={parseFloat(author.totalRoyaltyToPay?.replace('₹', '')) === 0}
                                  className="bg-indigo-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <CurrencyRupeeIcon className="h-4 w-4" />
                                  <span className="hidden lg:inline">Pay Author</span>
                                  <span className="lg:hidden">Pay</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                            }`}>
                            <div className="p-3 sm:p-6">
                              {/* Detailed Author Stats - Responsive */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-center">
                                  <div className="text-lg sm:text-xl font-bold text-blue-600">{author.totalBooks}</div>
                                  <div className="text-xs text-blue-700">Total Books</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 text-center">
                                  <div className="text-lg sm:text-xl font-bold text-green-600">{author.confirmedQuantity || (author.totalSales - author.pendingQuantity - author.cancelledQuantity) || 0}</div>
                                  <div className="text-xs text-green-700">Confirmed</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 text-center">
                                  <div className="text-lg sm:text-xl font-bold text-yellow-600">{author.pendingQuantity}</div>
                                  <div className="text-xs text-yellow-700">Pending</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3 text-center">
                                  <div className="text-lg sm:text-xl font-bold text-purple-600">{author.totalEarnings}</div>
                                  <div className="text-xs text-purple-700">Earnings</div>
                                </div>
                              </div>

                              {/* Books Grid */}
                              <div>
                                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                  📚 Books ({author.books.length})
                                </h4>
                                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                  {author.books.map((book, bookIndex) => (
                                    <div
                                      key={book.bookId}
                                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-indigo-300"
                                    >
                                      {/* Book Title - Responsive */}
                                      <div className="mb-3" style={{ height: '2.5rem', display: 'flex', alignItems: 'flex-start' }}>
                                        <h5 className="font-semibold text-indigo-700 text-sm sm:text-base leading-5 line-clamp-2">
                                          {book.bookTitle}
                                        </h5>
                                      </div>

                                      {/* Book Price & Royalty - Responsive */}
                                      <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-gray-600 mb-3 gap-1 sm:gap-0">
                                        <span className="font-medium">Price: <span className="text-gray-800">{book.bookPrice}</span></span>
                                        <span className="font-medium">Royalty: <span className="text-gray-800">{book.royaltySetByAuthor}</span></span>
                                      </div>

                                      {/* Payment Status - Responsive */}
                                      <div className={`p-2 sm:p-3 rounded-lg mb-3 text-center ${book.isPaid
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-indigo-50 border border-indigo-200'
                                        }`} style={{ minHeight: '70px' }}>
                                        {book.isPaid ? (
                                          <div className="flex flex-col justify-center h-full">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                              <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                              <span className="text-xs sm:text-sm font-bold text-green-600">PAID</span>
                                            </div>
                                            <div className="text-sm sm:text-base font-bold text-green-600 mb-1">
                                              {book.totalRoyalty}
                                            </div>
                                            <div className="text-xs text-green-600">
                                              {new Date(book.lastPaymentDate).toLocaleDateString('en-IN')}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col justify-center h-full">
                                            <div className="text-sm sm:text-base font-bold text-indigo-600 mb-2">
                                              {book.totalRoyaltyToPay}
                                            </div>
                                            <button
                                              onClick={() => handleBookPayment(book, author.authorName)}
                                              disabled={parseFloat(book.totalRoyaltyToPay?.replace('₹', '')) === 0}
                                              className="w-full bg-indigo-600 text-white px-2 py-1.5 sm:py-2 rounded text-xs sm:text-sm hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                                            >
                                              Pay Book
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Complete Stats Grid - Responsive */}
                                      <div className="space-y-2">
                                        {/* Row 1: Total & Confirmed */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-blue-50 border border-blue-200 p-2 rounded text-center">
                                            <div className="text-sm sm:text-base font-bold text-blue-600">{book.totalQuantity}</div>
                                            <div className="text-xs text-blue-700">Total Sales</div>
                                          </div>
                                          <div className="bg-green-50 border border-green-200 p-2 rounded text-center">
                                            <div className="text-sm sm:text-base font-bold text-green-600">{book.confirmedQuantity || 0}</div>
                                            <div className="text-xs text-green-700">Confirmed</div>
                                          </div>
                                        </div>

                                        {/* Row 2: Pending & Cancelled */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-center">
                                            <div className="text-sm sm:text-base font-bold text-yellow-600">{book.pendingQuantity || 0}</div>
                                            <div className="text-xs text-yellow-700">Pending</div>
                                          </div>
                                          <div className="bg-red-50 border border-red-200 p-2 rounded text-center">
                                            <div className="text-sm sm:text-base font-bold text-red-600">{book.cancelledQuantity || 0}</div>
                                            <div className="text-xs text-red-700">Cancelled</div>
                                          </div>
                                        </div>

                                        {/* Row 3: Earnings & Royalty Info */}
                                        <div className="grid grid-cols-1 gap-2">
                                          <div className="bg-purple-50 border border-purple-200 p-2 rounded text-center">
                                            <div className="text-sm sm:text-base font-bold text-purple-600">{book.totalEarnings}</div>
                                            <div className="text-xs text-purple-700">Total Earnings</div>
                                          </div>
                                        </div>

                                        {/* Additional Royalty Info */}
                                        {(book.pendingRoyalty || book.cancelledRoyalty) && (
                                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200">
                                            {book.pendingRoyalty && (
                                              <div className="text-center">
                                                <div className="text-xs font-bold text-yellow-600">{book.pendingRoyalty}</div>
                                                <div className="text-xs text-yellow-700">Pending Royalty</div>
                                              </div>
                                            )}
                                            {book.cancelledRoyalty && (
                                              <div className="text-center">
                                                <div className="text-xs font-bold text-red-600">{book.cancelledRoyalty}</div>
                                                <div className="text-xs text-red-700">Cancelled Royalty</div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default RoyaltyReport;
