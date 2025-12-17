import React, { useState } from 'react';

const RoyaltyManagement = ({ stats, role }) => {
  const [searchRoyalties, setSearchRoyalties] = useState("");
  const [showPaid, setShowPaid] = useState(false);
  const [selectedRoyalty, setSelectedRoyalty] = useState(null);
  const [modalSearch, setModalSearch] = useState("");

  if (role !== "admin" || !stats?.royalties) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Royalty Management
        </h2>
        <p className="text-gray-600">Track and manage author payments</p>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              className="w-full bg-white/90 backdrop-blur-sm border border-gray-300 pl-12 pr-4 py-3 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
              placeholder="Search author name..."
              value={searchRoyalties}
              onChange={(e) => setSearchRoyalties(e.target.value)}
            />
          </div>
        </div>
        <button
          className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap ${showPaid
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg"
              : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:shadow-lg"
            }`}
          onClick={() => setShowPaid((prev) => !prev)}
        >
          {showPaid ? "Show Unpaid 💸" : "Show Paid ✅"}
        </button>
      </div>

      {stats.royalties.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-gray-200/50">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left p-6 font-semibold text-gray-800">Author</th>
                    <th className="text-center p-6 font-semibold text-gray-800">Amount</th>
                    <th className="text-center p-6 font-semibold text-gray-800">Status</th>
                    <th className="text-center p-6 font-semibold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.royalties
                    .filter(r => r.name.toLowerCase().includes(searchRoyalties.toLowerCase()))
                    .filter(r => showPaid ? r.status === "paid" : r.status !== "paid")
                    .map((royalty, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                        <td className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold">
                                {royalty.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{royalty.name}</p>
                              <p className="text-sm text-gray-500">Author</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-6">
                          <p className="text-xl font-bold text-green-600">
                            ₹{royalty.status === "paid" ? 0 : (royalty.toPay || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="text-center p-6">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${royalty.status === "paid"
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                              : "bg-gradient-to-r from-red-100 to-orange-100 text-red-800"
                            }`}>
                            {royalty.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="text-center p-6">
                          <button
                            onClick={() => setSelectedRoyalty(royalty)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.royalties
              .filter(r => r.name.toLowerCase().includes(searchRoyalties.toLowerCase()))
              .filter(r => showPaid ? r.status === "paid" : r.status !== "paid")
              .map((royalty, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">
                          {royalty.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{royalty.name}</h3>
                        <p className="text-xs text-gray-500">Author</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${royalty.status === "paid"
                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                        : "bg-gradient-to-r from-red-100 to-orange-100 text-red-800"
                      }`}>
                      {royalty.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount to Pay:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{royalty.status === "paid" ? 0 : (royalty.toPay || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRoyalty(royalty)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    View Details
                  </button>
                </div>
              ))
            }
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Royalty Data</h3>
          <p className="text-gray-500">Royalty information will appear here when available</p>
        </div>
      )}

      {/* Enhanced Royalty Details Modal */}
      {selectedRoyalty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {selectedRoyalty.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold">Royalty Details</h3>
                    <p className="text-white/80 text-lg">Author: {selectedRoyalty.name}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-white/60">🔍</span>
                    </div>
                    <input
                      placeholder="Search book name..."
                      className="w-full lg:w-auto min-w-[250px] bg-white/20 backdrop-blur-sm border border-white/30 pl-12 pr-4 py-3 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-white/60"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl">
                      <p className="text-sm text-white/80">Total Amount</p>
                      <p className="text-xl font-bold">₹{(selectedRoyalty.toPay || 0).toLocaleString()}</p>
                    </div>
                    {selectedRoyalty.status !== "paid" && (
                      <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl hover:bg-white/90 font-bold transition-all duration-200 transform hover:scale-105">
                        💳 Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Book Details</h3>
                <p className="text-gray-500">Detailed book information and payment breakdown will be displayed here.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 sm:p-8 border-t border-gray-200/50 bg-gray-50/50">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRoyalty(null)}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoyaltyManagement;