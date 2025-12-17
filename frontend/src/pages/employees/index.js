import Button from "@/components/Button";
import Layout from "@/layout/Layout";
import SmallCard from "@/modules/books/SmallCard";
import FilterBar from "@/modules/FilterBar";
import Loader from "@/modules/Loader";
import Pagination from "@/modules/Pagination";
import { getAllEmployees } from "@/services/APIs/employees";
import { debounce } from "@/Utilities/helpers";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Index({ role }) {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationData, setPaginationData] = useState(null);

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    sort: "",
    page: 1,
    limit: 10,
  });

  const router = useRouter();

  const fetchAllEmployees = async () => {
    setLoading(true);
    const response = await getAllEmployees({ role: "employee" });
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

    // ↕️ Sort
    if (query.sort === "1") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // old to new
    } else if (query.sort === "2") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // new to old
    }

    // 📄 Pagination
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

  const filterHandler = useCallback(
    (keyword, status, page, limit, sort) => {
      const updatedFilters = {
        keyword: keyword ?? "",
        status: status ?? "",
        sort: sort ?? "",
        page: page ?? 1,
        limit: limit ?? 10,
      };
      setFilters(updatedFilters);
      applyFilters(rawData, updatedFilters);
    },
    [rawData]
  );

  const debouncedFilterHandler = useCallback(
    debounce((keyword, status, page, limit, sort) => {
      filterHandler(keyword, status, page, limit, sort);
    }, 400),
    [filterHandler]
  );

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  return (
    <Layout role={role}>
      <div className="p-10 mt-16 lg:mt-0">
        {/* Modern Header Section */}
        <div className="w-full">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-4 lg:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-gray-900 text-2xl font-bold">Employees</h1>
              <Button
                variant="primary"
                className="flex items-center px-4 py-2 text-sm rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => router.push("/employees/create")}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add
              </Button>
            </div>

            {/* Stats Cards - Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{rawData.length}</div>
                <div className="text-purple-100 text-sm">Total Employees</div>
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
              <h1 className="text-gray-900 text-3xl font-semibold">Employees</h1>
            </div>

            <Button
              variant="primary"
              className="flex items-center w-70 px-6 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => router.push("/employees/create")}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Employee
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 m-5 sm:grid-cols-3 gap-4">
            {/* Total Employees */}
            <div className="flex items-center gap-4 rounded-2xl bg-white shadow-sm border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">{rawData.length}</div>
                <div className="text-gray-500 text-sm">Total Employees</div>
              </div>
            </div>

            {/* Active Employees */}
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

            {/* Suspended Employees */}
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
            {/* Filter Bar */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="p-4 lg:p-6">
                <FilterBar
                  data={rawData}
                  sort={true}
                  handler={filterHandler}
                  debouncedHandler={debouncedFilterHandler}
                  placeholder="Search by employee name or email..."
                  currentFilters={filters}
                  statusOptions={[
                    { label: "All Status", value: "" },
                    { label: "Active", value: "1" },
                    { label: "Suspended", value: "2" },
                  ]}
                />
              </div>

              {/* Results Info */}
              <div className="flex items-center justify-between px-4 lg:px-6 pb-4">
                <div className="text-sm text-gray-600">
                  {paginationData && (
                    <span>
                      Showing {((paginationData.page - 1) * paginationData.limit) + 1}-
                      {Math.min(paginationData.page * paginationData.limit, paginationData.totalResults)} of {paginationData.totalResults} employees
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="text-gray-600">Loading employees...</span>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                    <Button
                      variant="primary"
                      onClick={() => router.push("/employees/create")}
                      className="inline-flex items-center px-6 py-3 rounded-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                    {filteredData.map((item, index) => (
                      <div
                        key={`Employee-${index}`}
                        className="group bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                      >
                        <SmallCard
                          url={`/employees/${item._id}`}
                          variant={!item.isBlocked}
                          name={item.name}
                          description={item.email}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
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
