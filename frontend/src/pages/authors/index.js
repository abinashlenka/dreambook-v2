import Button from "@/components/Button";
import Layout from "@/layout/Layout";
import SmallCard from "@/modules/books/SmallCard";
import FilterBar from "@/modules/FilterBar";
import Loader from "@/modules/Loader";
import Pagination from "@/modules/Pagination";
import { getAllAuthors } from "@/services/APIs/author";
import { debounce } from "@/Utilities/helpers";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Index({ role }) {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationData, setPaginationData] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    sort: "",
    page: 1,
    limit: 10,
  });

  const router = useRouter();

  const fetchAllAuthors = async () => {
    setLoading(true);
    const response = await getAllAuthors({ role: "author" });
    if (response.status) {
      setRawData(response.data.results);
      applyFilters(response.data.results, filters);
    } else {
      setRawData([]);
      setFilteredData([]);
    }
    setLoading(false);
  };

  const applyFilters = (data, query) => {
    let filtered = [...data];

    // 🔍 Search by name or email
    if (query.keyword) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(query.keyword.toLowerCase()) ||
          item.email?.toLowerCase().includes(query.keyword.toLowerCase())
      );
    }

    // 📌 Status filtering
    if (query.status === "1") {
      filtered = filtered.filter((item) => item.isBlocked === false); // Active
    } else if (query.status === "2") {
      filtered = filtered.filter((item) => item.isBlocked === true); // Suspended
    }

    // ↕️ Sorting
    if (query.sort === "1") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // old to new
    } else if (query.sort === "2") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // new to old
    }

    // 🧾 Pagination
    const startIndex = (query.page - 1) * query.limit;
    const paginated = filtered.slice(startIndex, startIndex + query.limit);

    setFilteredData(paginated);
    setPaginationData({
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(filtered.length / query.limit),
      totalResults: filtered.length,
    });
  };

  const filterHandler = useCallback((keyword, status, page, limit, sort) => {
    const updatedFilters = {
      keyword: keyword ?? "",
      status: status ?? "",
      sort: sort ?? "",
      page: page ?? 1,
      limit: limit ?? 10,
    };
    setFilters(updatedFilters);
    applyFilters(rawData, updatedFilters);
  }, [rawData]);

  const debouncedFilterHandler = useCallback(
    debounce((keyword, status, page, limit, sort) => {
      filterHandler(keyword, status, page, limit, sort);
    }, 400),
    [filterHandler]
  );

  useEffect(() => {
    fetchAllAuthors();
  }, []);

  return (
    <Layout role={role}>
      <div className="p-10 mt-16 lg:mt-0">
        {/* Modern Header Section */}
        <div className="w-full">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-4 lg:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-gray-900 text-2xl font-bold">Authors</h1>
              <Button
                variant="primary"
                className="flex items-center px-4 py-2 text-sm rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => router.push("/authors/create")}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add
              </Button>
            </div>

            {/* Stats Cards - Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{rawData.length}</div>
                <div className="text-blue-100 text-sm">Total Authors</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{rawData.filter(a => !a.isBlocked).length}</div>
                <div className="text-green-100 text-sm">Active</div>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Title */}
              <h1 className="text-gray-900 text-3xl font-semibold">Authors</h1>

              {/* Stats Cards */}

            </div>


            <Button
              variant="primary"
              className="flex  items-center w-70 px-6 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/authors/create")}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Author
            </Button>
          </div>
          <div className="grid grid-cols-1 m-5 sm:grid-cols-3 gap-4">
            {/* Total Authors */}
            <div className="flex items-center gap-4 rounded-2xl bg-white shadow-sm border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">{rawData.length}</div>
                <div className="text-gray-500 text-sm">Total Authors</div>
              </div>
            </div>

            {/* Active Authors */}
            <div className="flex items-center gap-4 rounded-2xl bg-white shadow-sm border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">{rawData.filter(a => !a.isBlocked).length}</div>
                <div className="text-gray-500 text-sm">Active</div>
              </div>
            </div>

            {/* Suspended Authors */}
            <div className="flex items-center gap-4 rounded-2xl bg-white shadow-sm border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 14h-2v-2h2Zm0-4h-2V7h2Z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">{rawData.filter(a => a.isBlocked).length}</div>
                <div className="text-gray-500 text-sm">Suspended</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="w-full mt-6 lg:mt-8">
          {/* Enhanced Filter Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filter Bar with View Toggle */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4 lg:p-6">
                <FilterBar
                  data={rawData}
                  sort={true}
                  handler={filterHandler}
                  debouncedHandler={debouncedFilterHandler}
                  placeholder="Search by author name or email..."
                  currentFilters={filters}
                  statusOptions={[
                    { label: "All Status", value: "" },
                    { label: "Active", value: "1" },
                    { label: "Suspended", value: "2" },
                  ]}
                />
              </div>

              {/* View Toggle & Results Info */}
              <div className="flex items-center justify-between px-4 lg:px-6 pb-4">
                <div className="text-sm text-gray-600">
                  {paginationData && (
                    <span>
                      Showing {((paginationData.page - 1) * paginationData.limit) + 1}-
                      {Math.min(paginationData.page * paginationData.limit, paginationData.totalResults)} of {paginationData.totalResults} authors
                    </span>
                  )}
                </div>

                {/* View Mode Toggle */}
                {/* <div className="hidden sm:flex bg-white rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div> */}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">Loading authors...</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            {!loading && (
              <div className="p-4 lg:p-6">
                {filteredData.length === 0 ? (
                  /* Empty State */
                  <div className="text-center py-16">
                    <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No authors found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                    <Button
                      variant="primary"
                      onClick={() => router.push("/authors/create")}
                      className="inline-flex items-center px-6 py-3 rounded-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add First Author
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Grid View */}
                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                        {filteredData.map((item, index) => (
                          <div
                            key={`Author-${index}`}
                            className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                          >
                            <SmallCard
                              url={`/authors/${item._id}`}
                              variant={!item.isBlocked}
                              name={item.name}
                              description={item.email}
                              className="h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* List View */}
                    {viewMode === 'list' && (
                      <div className="space-y-3">
                        {filteredData.map((item, index) => (
                          <div
                            key={`Author-${index}`}
                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => router.push(`/authors/${item._id}`)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                  {item.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!item.isBlocked
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {!item.isBlocked ? 'Active' : 'Suspended'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{item.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Enhanced Pagination */}
            {!loading && paginationData && paginationData.totalResults > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 lg:px-6">
                <Pagination
                  filters={filters}
                  data={paginationData}
                  handler={filterHandler}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const role = req.cookies._r || null;
  return {
    props: {
      role,
    },
  };
}