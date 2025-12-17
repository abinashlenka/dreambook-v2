import React from 'react';

const TopAuthors = ({ stats }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Top Performing Authors
        </h2>
        <p className="text-gray-600">Star contributors and their earnings</p>
      </div>
      
      {stats?.topRatedAuthors?.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200/50">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="text-left p-6 font-semibold text-gray-800">Author</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Sales</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Earnings</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Returns</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Return Loss</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRatedAuthors.map((author, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold">
                            {(author.name || "U").charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{author.name || "Unknown Author"}</p>
                          <p className="text-sm text-gray-500">Author</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-6">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {author.sales || 0}
                      </div>
                    </td>
                    <td className="text-center p-6">
                      <span className="text-lg font-bold text-green-600">₹{(author.earnings || 0).toFixed(2)}</span>
                    </td>
                    <td className="text-center p-6">
                      <span className="text-orange-600 font-medium">{author.returned || 0}</span>
                    </td>
                    <td className="text-center p-6">
                      <span className="text-red-600 font-medium">-₹{(author.returnRoyalty || 0).toFixed(2)}</span>
                    </td>
                    <td className="text-center p-6">
                      <span className="text-xl font-bold text-indigo-600">₹{(author.toPay || 0).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topRatedAuthors.map((author, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(author.name || "U").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{author.name || "Unknown Author"}</h3>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">₹{(author.toPay || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Net Pay</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sales</p>
                    <p className="font-semibold text-blue-600">{author.sales || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Earnings</p>
                    <p className="font-semibold text-green-600">₹{(author.earnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Returns</p>
                    <p className="font-semibold text-orange-600">{author.returned || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Author Data</h3>
          <p className="text-gray-500">Author information will appear here when available</p>
        </div>
      )}
    </div>
  );
};

export default TopAuthors;