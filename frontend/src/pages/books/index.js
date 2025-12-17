// import Button from "@/components/Button";
// import Layout from "@/layout/Layout";
// import Card from "@/modules/books/Card";
// import FilterBar from "@/modules/FilterBar";
// import Loader from "@/modules/Loader";
// import Pagination from "@/modules/Pagination";
// import { getAllBooks, getAssignedBooks, deleteBook } from "@/services/APIs/books";
// import { debounce } from "@/Utilities/helpers";
// import { useRouter } from "next/router";
// import { useCallback, useEffect, useState } from "react";
// import Image from 'next/image'

// // 👇 Redux imports
// import { useSelector, useDispatch } from "react-redux";
// import { setPage, setLimit } from "@/store/paginationSlice";

// export default function Index({ role }) {
//   const dispatch = useDispatch();
//   const { page, limit } = useSelector((state) => state.pagination);

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [paginationData, setPaginationData] = useState(null);
//   const [viewMode, setViewMode] = useState('grid');
//   const router = useRouter();
//   const [userId, setUserId] = useState(null);

//   // delete book
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [bookToDelete, setBookToDelete] = useState(null);

//   // Employee-specific state
//   const [categorizedData, setCategorizedData] = useState({});

//   // ✅ Simplified state management
//   const [activeTab, setActiveTab] = useState('all');
//   const [searchKeyword, setSearchKeyword] = useState("");
//   const [currentSort, setCurrentSort] = useState("");

//   // ✅ Single source of truth for filters
//   const [filters, setFilters] = useState({
//     search: "",
//     keyword: "",
//     status: "",
//     sort: "",
//     page,
//     limit,
//   });

//   // Track initialization state
//   const [isInitialized, setIsInitialized] = useState(false);

//   // Sync filters with redux pagination
//   useEffect(() => {
//     setFilters((prev) => ({ ...prev, page, limit }));
//   }, [page, limit]);

//   // Get userId from localStorage
//   useEffect(() => {
//     const id = localStorage.getItem("userId");
//     if (id) setUserId(id);
//   }, []);

//   // Categorize books for employees
//   const categorizeBooksByAdmin = (books) => {
//     const categorized = {};
//     books.forEach(book => {
//       const adminName = book.assignedBy?.name || 'Unknown Admin';
//       const adminEmail = book.assignedBy?.email || '';
//       const adminKey = `${adminName} (${adminEmail})`;

//       if (!categorized[adminKey]) {
//         categorized[adminKey] = {
//           adminInfo: book.assignedBy,
//           all: [],
//           pending: [],
//           approved: [],
//           rejected: []
//         };
//       }

//       categorized[adminKey].all.push(book);

//       const status = book.status?.toLowerCase() || 'pending';
//       if (categorized[adminKey][status]) {
//         categorized[adminKey][status].push(book);
//       }
//     });
//     return categorized;
//   };

//   // ✅ Consolidated fetch data function
//   const fetchData = async (queryFilters = filters, tab = activeTab) => {
//     try {
//       setLoading(true);

//       // Prepare API parameters based on active tab
//       let apiParams = { ...queryFilters };

//       // Handle unassigned books - FIXED LOGIC
//       if (tab === 'unassigned') {
//         apiParams.keyword = "unassigned";
//         apiParams.search = ""; // Clear search for unassigned
//         apiParams.status = ""; // Clear status for unassigned
//       } else if (tab !== 'all') {
//         // For status tabs (pending, approved, rejected)
//         apiParams.status = tab;
//         apiParams.keyword = ""; // Clear keyword for status tabs
//         apiParams.search = queryFilters.search || ""; // Keep existing search if any
//       } else {
//         // For 'all' tab, use existing search and clear keyword
//         apiParams.search = queryFilters.search || "";
//         apiParams.keyword = "";
//       }

//       // For assigned books (employee view)
//       if (role === "employee") {
//         apiParams.keyword = "assigned";
//         apiParams.search = ""; // Clear search for employee view
//         apiParams.status = ""; // Clear status for employee view - employee tabs handle filtering client-side
//       }

//       console.log("📡 API call with params:", apiParams);

//       let response;
//       let booksData = [];
//       let pagination = {};

//       if (role === "employee") {
//         response = await getAssignedBooks(apiParams, userId);

//         if (response?.status) {
//           // Map assigned books to include admin info
//           booksData = response.data.map(item => ({
//             ...item.book,
//             assignedAt: item.assignedAt,
//             assignedBy: item.assignedBy,
//             assignmentId: item.assignmentId,
//           }));

//           // Categorize books by admin
//           const categorized = categorizeBooksByAdmin(booksData);
//           setCategorizedData(categorized);

//           pagination = {
//             page: response.pagination?.page || 1,
//             limit: response.pagination?.limit || apiParams.limit || 10,
//             totalPages: response.pagination?.totalPages || 1,
//             total: response.pagination?.total || booksData.length,
//           };
//         }
//       } else {
//         response = await getAllBooks(apiParams);

//         if (response?.status) {
//           booksData = response.data;
//           pagination = {
//             page: response.pagination?.page || apiParams.page,
//             limit: response.pagination?.limit || apiParams.limit,
//             totalPages: response.pagination?.totalPages || 1,
//             total: response.pagination?.total || booksData.length,
//           };
//         }
//       }

//       setData(booksData);
//       setPaginationData(pagination);

//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setData([]);
//       setPaginationData({
//         page: 1,
//         limit: limit,
//         totalPages: 0,
//         total: 0,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ SINGLE INITIALIZATION EFFECT - runs only once
//   useEffect(() => {
//     if (isInitialized) return;

//     const initializeData = async () => {
//       // Check for saved state first
//       if (typeof window !== 'undefined') {
//         const saved = sessionStorage.getItem('booksListState');

//         if (saved) {
//           try {
//             const savedState = JSON.parse(saved);
//             console.log("🔄 Restoring state:", savedState);

//             // Restore states
//             if (savedState.activeTab) setActiveTab(savedState.activeTab);
//             if (savedState.searchKeyword !== undefined) setSearchKeyword(savedState.searchKeyword);
//             if (savedState.currentSort !== undefined) setCurrentSort(savedState.currentSort);

//             // Restore pagination
//             if (savedState.page) dispatch(setPage(savedState.page));
//             if (savedState.limit) dispatch(setLimit(savedState.limit));

//             // Restore filters
//             const restoredFilters = {
//               search: savedState.searchKeyword || "",
//               keyword: savedState.activeTab === 'unassigned' ? "unassigned" : "",
//               status: savedState.activeTab === 'all' || savedState.activeTab === 'unassigned' ? "" : savedState.activeTab,
//               sort: savedState.currentSort || "",
//               page: savedState.page || 1,
//               limit: savedState.limit || 12,
//             };

//             console.log("✅ Restored filters:", restoredFilters);
//             setFilters(restoredFilters);

//             // Fetch with restored state
//             await fetchData(restoredFilters, savedState.activeTab);

//             // Clean up
//             sessionStorage.removeItem('booksListState');
//           } catch (e) {
//             console.warn('Failed to restore books list state:', e);
//             // Fallback to default fetch
//             await fetchDefaultData();
//           }
//         } else {
//           // No saved state, fetch default data
//           await fetchDefaultData();
//         }
//       } else {
//         // Server-side, fetch default data
//         await fetchDefaultData();
//       }

//       setIsInitialized(true);
//     };

//     const fetchDefaultData = async () => {
//       // For employees, wait for userId
//       if (role === 'employee') {
//         if (userId !== null) {
//           await fetchData(filters, activeTab);
//         }
//       } else {
//         // For non-employees/admins, fetch immediately
//         await fetchData(filters, activeTab);
//       }
//     };

//     initializeData();
//   }, [role, userId, isInitialized]);

//   // ✅ Effect to handle employee userId availability
//   useEffect(() => {
//     if (isInitialized && role === 'employee' && userId !== null) {
//       fetchData(filters, activeTab);
//     }
//   }, [userId, isInitialized, role]);

//   const confirmDeleteBook = (bookId) => {
//     console.log("🗑 Confirm delete triggered for bookId:", bookId);
//     setBookToDelete(bookId);
//     setConfirmOpen(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (!bookToDelete) return;

//     try {
//       console.log("🛠 Deleting book with ID:", bookToDelete);
//       const response = await deleteBook(bookToDelete);

//       console.log("✅ Delete response:", response);

//       // Refresh the list after delete
//       fetchData(filters, activeTab);
//     } catch (err) {
//       console.error("❌ Error deleting book:", err);
//     } finally {
//       setConfirmOpen(false);
//       setBookToDelete(null);
//     }
//   };

//   // ✅ FIXED: Create stable debounced handler using useCallback
//   const debouncedFilterHandler = useCallback(
//     debounce((search, status, pageValue, limitValue, sort) => {
//       console.log("🎯 Debounced filter handler called with:", { search, status, pageValue, limitValue, sort });

//       const newFilters = {
//         search: search !== undefined ? search : filters.search,
//         keyword: filters.keyword,
//         status: status !== undefined ? status : filters.status,
//         sort: sort !== undefined ? sort : currentSort,
//         page: pageValue !== undefined ? pageValue : page,
//         limit: limitValue !== undefined ? limitValue : limit,
//       };

//       console.log("🚀 Final filters to be applied:", newFilters);

//       setFilters(newFilters);
//       setSearchKeyword(newFilters.search);
//       setCurrentSort(newFilters.sort);

//       fetchData(newFilters, activeTab);

//       if (pageValue !== undefined) dispatch(setPage(pageValue));
//       if (limitValue !== undefined) dispatch(setLimit(limitValue));
//     }, 500), // Increased debounce time to 500ms
//     [filters.search, filters.keyword, filters.status, currentSort, activeTab, dispatch, page, limit]
//   );

//   // ✅ FIXED: Immediate filter handler for non-search operations
//   const immediateFilterHandler = useCallback(
//     (search, status, pageValue, limitValue, sort) => {
//       console.log("🎯 Immediate filter handler called with:", { search, status, pageValue, limitValue, sort });

//       const newFilters = {
//         search: search !== undefined ? search : filters.search,
//         keyword: filters.keyword,
//         status: status !== undefined ? status : filters.status,
//         sort: sort !== undefined ? sort : currentSort,
//         page: pageValue !== undefined ? pageValue : page,
//         limit: limitValue !== undefined ? limitValue : limit,
//       };

//       console.log("🚀 Final filters to be applied:", newFilters);

//       setFilters(newFilters);
//       setSearchKeyword(newFilters.search);
//       setCurrentSort(newFilters.sort);

//       fetchData(newFilters, activeTab);

//       if (pageValue !== undefined) dispatch(setPage(pageValue));
//       if (limitValue !== undefined) dispatch(setLimit(limitValue));
//     },
//     [filters.search, filters.keyword, filters.status, currentSort, activeTab, dispatch, page, limit]
//   );

//   // ✅ NEW: Handle search input specifically with proper debouncing
//   const handleSearchInput = useCallback((searchValue) => {
//     setSearchKeyword(searchValue);

//     // Reset to first page when searching
//     dispatch(setPage(1));

//     // Use debounced handler for search to avoid multiple API calls
//     debouncedFilterHandler(
//       searchValue,
//       activeTab === 'all' || activeTab === 'unassigned' ? '' : activeTab,
//       1,
//       limit,
//       currentSort
//     );
//   }, [activeTab, limit, currentSort, dispatch, debouncedFilterHandler]);

//   const handleNavigateToBook = (bookId) => {
//     // Store the current state before navigation
//     const currentState = {
//       activeTab: activeTab,
//       searchKeyword: searchKeyword,
//       currentSort: currentSort,
//       page: page,
//       limit: limit,
//     };

//     console.log("📦 Storing state before navigation:", currentState);
//     sessionStorage.setItem('booksListState', JSON.stringify(currentState));

//     router.push(`/books/${bookId}`);
//   };

//   // ✅ Improved tab handler - FIXED: properly handle employee vs admin tabs
//   const handleTabClick = (tabKey) => {
//     console.log("🎯 Tab clicked:", tabKey);

//     // Update active tab immediately
//     setActiveTab(tabKey);

//     // Reset to first page when changing tabs
//     dispatch(setPage(1));

//     if (role === "employee") {
//       // For employees, we filter client-side from categorized data
//       // No API call needed, just update the active tab
//       console.log("👨‍💼 Employee tab change - filtering client-side");
//     } else {
//       // For admins, prepare new filters for the tab
//       const newFilters = {
//         ...filters,
//         page: 1,
//         // Clear search when switching to special tabs
//         search: tabKey === 'unassigned' ? "" : filters.search,
//         // Set keyword only for unassigned, clear for others
//         keyword: tabKey === 'unassigned' ? "unassigned" : "",
//         status: tabKey === 'all' || tabKey === 'unassigned' ? '' : tabKey,
//       };

//       console.log("🔄 New filters for tab:", newFilters);

//       setFilters(newFilters);
//       setSearchKeyword(newFilters.search);
//       fetchData(newFilters, tabKey);
//     }
//   };

//   // Status counts for employee tabs
//   const getStatusCounts = () => {
//     const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
//     Object.values(categorizedData).forEach(adminData => {
//       counts.all += adminData.all.length;
//       counts.pending += adminData.pending.length;
//       counts.approved += adminData.approved.length;
//       counts.rejected += adminData.rejected.length;
//     });
//     return counts;
//   };

//   const statusCounts = getStatusCounts();

//   // ✅ FIXED: Get filtered data for employee view
//   const getFilteredDataForEmployee = () => {
//     if (activeTab === 'all') {
//       // Return all books from all admins
//       const allBooks = [];
//       Object.values(categorizedData).forEach(adminData => {
//         allBooks.push(...adminData.all);
//       });
//       return allBooks;
//     } else {
//       // Return books filtered by status from all admins
//       const filteredBooks = [];
//       Object.values(categorizedData).forEach(adminData => {
//         if (adminData[activeTab]) {
//           filteredBooks.push(...adminData[activeTab]);
//         }
//       });
//       return filteredBooks;
//     }
//   };

//   const EmployeeCategorizedView = () => {
//     const employeeFilteredData = getFilteredDataForEmployee();

//     return (
//       <div className="space-y-8">
//         <div className="bg-white rounded-xl border border-gray-200 p-4">
//           <div className="flex flex-wrap gap-2">
//             {[{ key: 'all', label: 'All Books', color: 'bg-gray-100 text-gray-700' },
//             { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
//             { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
//             { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' }].map(tab => (
//               <button
//                 key={tab.key}
//                 onClick={() => handleTabClick(tab.key)}
//                 className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.key
//                   ? 'bg-indigo-600 text-white shadow-lg'
//                   : `${tab.color} hover:shadow-md`
//                   }`}
//               >
//                 {tab.label}
//                 <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${activeTab === tab.key
//                   ? 'bg-white text-indigo-600'
//                   : 'bg-white/50'
//                   }`}>{statusCounts[tab.key]}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {employeeFilteredData.length > 0 ? (
//           Object.entries(categorizedData).map(([adminKey, adminData]) => {
//             const booksToShow = activeTab === 'all' ? adminData.all : adminData[activeTab] || [];
//             if (booksToShow.length === 0) return null;

//             return (
//               <div key={adminKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {adminData.adminInfo?.name || 'Unknown Admin'}
//                       </h3>
//                       <p className="text-sm text-gray-600">{adminData.adminInfo?.email}</p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
//                         {booksToShow.length} {booksToShow.length === 1 ? 'book' : 'books'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="p-6">
//                   <div className={`${viewMode === 'grid'
//                     ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
//                     : 'flex flex-col space-y-4'
//                     }`}>
//                     {booksToShow.map((book, index) => (
//                       <div key={book._id || book.id || index} className="transform transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
//                         <Card data={book} variant={book.status} onNavigate={handleNavigateToBook} viewMode={viewMode} />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
//             <div className="mb-6">
//               <svg className="mx-auto w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//               </svg>
//             </div>
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               No {activeTab !== 'all' ? activeTab : ''} books found
//             </h3>
//             <p className="text-gray-500">Check back later or contact your administrator.</p>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <Layout role={role}>
//       <div className="p-10 mt-16 lg:mt-0">
//         {/* Filters Section */}
//         <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 mb-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//             <div className="items-center gap-3">
//               <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
//                 📚 {role === 'employee' ? 'My Assigned Books' : 'Book Library'}
//               </h1>
//               {paginationData && (
//                 <span className="text-xs ml-10 text-gray-500">
//                   {paginationData.total || data.length} total books
//                 </span>
//               )}
//             </div>

//             {/* Center Section - Search Bar */}
//             {role !== 'employee' && (
//               <div className="flex-1 md:max-w-md w-full text-[14px] min-w-[220px]">
//                 <FilterBar
//                   data={data}
//                   sort={true}
//                   handler={(search, status, page, limit, sort) => {
//                     // ✅ For non-search operations, use immediate handler
//                     if (status !== undefined || page !== undefined || limit !== undefined || sort !== undefined) {
//                       immediateFilterHandler(search, status, page, limit, sort);
//                     } else {
//                       // For search operations, use the debounced handler via handleSearchInput
//                       handleSearchInput(search);
//                     }
//                   }}
//                   debouncedHandler={(search, status, page, limit, sort) => {
//                     // ✅ Use debounced handler for search
//                     debouncedFilterHandler(search, status, page, limit, sort);
//                   }}
//                   currentFilters={{
//                     search: searchKeyword,
//                     status: activeTab === 'all' || activeTab === 'unassigned' ? '' : activeTab,
//                     sort: currentSort,
//                     page: filters.page,
//                     limit: filters.limit
//                   }}
//                   placeholder="Search books..."
//                   disabled={false}
//                 />
//               </div>
//             )}

//             {/* Right Section */}
//             <div className="flex items-center gap-2">
//               <div className="flex bg-gray-100 rounded-lg p-1">
//                 <button
//                   onClick={() => setViewMode("grid")}
//                   className={`p-2 rounded-md transition-all duration-200 ${viewMode === "grid" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
//                   title="Grid View"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
//                   </svg>
//                 </button>
//                 <button
//                   onClick={() => setViewMode("list")}
//                   className={`p-2 rounded-md transition-all duration-200 ${viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
//                   title="List View"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
//                   </svg>
//                 </button>
//               </div>

//               {/* Add Book Button (Restored from previous context) */}
//               <Button
//                 variant="secondary"
//                 className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
//                 onClick={() => router.push("/books/create")}
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
//                 </svg>
//                 Add Book
//               </Button>

//             </div>
//           </div>
//         </div>

//         {/* Books Display Section */}
//         <div className="min-h-[400px]">
//           {loading ? (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
//               <div className="flex flex-col items-center justify-center text-center space-y-6">

//                 <Image
//                   alt="dream-logo"
//                   src="/images/dream-book-logo.png"
//                   width={126}
//                   height={56}
//                   className="object-contain mx-auto"
//                 />

//                 <div className="space-y-2">
//                   <h2 className="text-2xl font-bold text-gray-800">DreamBook Publishing</h2>
//                   <p className="text-gray-600 text-sm sm:text-base">
//                     Please wait while we fetch your data...
//                   </p>
//                 </div>
//               </div>
//             </div>

//           ) : role === 'employee' ? (
//             <EmployeeCategorizedView />
//           ) : (
//             <>
//               {/* ✅ Tabs for non-employees */}
//               <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
//                 <div className="flex flex-wrap gap-2">
//                   {[
//                     { key: "all", label: "All Books", color: "bg-gray-100 text-gray-700" },
//                     { key: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
//                     { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
//                     { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
//                     { key: "unassigned", label: "🚫 Unassigned Books", color: "bg-rose-100 text-rose-700" }
//                   ]
//                     .filter(tab => role === "admin" || tab.key !== "unassigned")
//                     .map(tab => (
//                       <button
//                         key={tab.key}
//                         onClick={() => handleTabClick(tab.key)}
//                         className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab.key
//                           ? "bg-indigo-600 text-white shadow-lg"
//                           : `${tab.color} hover:shadow-md hover:scale-105`
//                           }`}
//                       >
//                         {tab.label}
//                       </button>
//                     ))}
//                 </div>
//               </div>

//               {data.length > 0 ? (
//                 <div className={`transition-all duration-500 ease-in-out ${viewMode === 'grid'
//                   ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
//                   : 'flex flex-col space-y-4'
//                   }`}>
//                   {data.map((book, index) => (
//                     <div
//                       key={book._id || book.id || index}
//                       className="transform transition-all duration-300 hover:scale-[1.02] animate-fade-in opacity-0"
//                       style={{
//                         animationDelay: `${index * 60}ms`,
//                         animationFillMode: "forwards"
//                       }}
//                     >
//                       <Card
//                         data={book}
//                         variant={book.status}
//                         role={role}
//                         handledeleteBook={() => confirmDeleteBook(book.id)}
//                         viewMode={viewMode}
//                         onNavigate={handleNavigateToBook}
//                         className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
//                   <div className="mb-6">
//                     <svg className="mx-auto w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                     </svg>
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
//                   <p className="text-gray-500">
//                     {activeTab === 'unassigned'
//                       ? 'No unassigned books available.'
//                       : activeTab !== 'all'
//                         ? `No ${activeTab} books found.`
//                         : 'Try adjusting your search criteria or add some books to get started.'}
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* Pagination */}
//         {!loading && paginationData && paginationData.totalPages > 1 && !(role === 'employee') && (
//           <div className="mt-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
//             <Pagination
//               filters={filters}
//               data={paginationData}
//               handler={immediateFilterHandler}
//             />
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation Modal */}
//       {confirmOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
//             <h2 className="text-lg font-semibold text-gray-900">Confirm Delete</h2>
//             <p className="text-gray-600 mt-2">Are you sure you want to delete this book?</p>

//             <div className="flex justify-end gap-3 mt-6">
//               <button
//                 onClick={() => setConfirmOpen(false)}
//                 className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmDelete}
//                 className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
//       `}</style>
//     </Layout>
//   );
// }

// export async function getServerSideProps({ req }) {
//   const role = req.cookies._r || null;
//   return { props: { role } };
// }

import Button from "@/components/Button";
import Layout from "@/layout/Layout";
import Card from "@/modules/books/Card";
import FilterBar from "@/modules/FilterBar";
import Loader from "@/modules/Loader";
import Pagination from "@/modules/Pagination";
import { getAllBooks, getAssignedBooks, deleteBook } from "@/services/APIs/books";
import { debounce } from "@/Utilities/helpers";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Image from 'next/image'

// 👇 Redux imports
import { useSelector, useDispatch } from "react-redux";
import { setPage, setLimit } from "@/store/paginationSlice";

export default function Index({ role }) {
  const dispatch = useDispatch();
  const { page, limit } = useSelector((state) => state.pagination);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationData, setPaginationData] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const router = useRouter();
  const [userId, setUserId] = useState(null);

  // delete book
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  // Employee-specific state
  const [categorizedData, setCategorizedData] = useState({});

  // ✅ Simplified state management
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentSort, setCurrentSort] = useState("");

  // ✅ Single source of truth for filters
  const [filters, setFilters] = useState({
    search: "",
    keyword: "",
    status: "",
    sort: "",
    page,
    limit,
  });

  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync filters with redux pagination
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page, limit }));
  }, [page, limit]);

  // Get userId from localStorage
  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);

  // Categorize books for employees
  const categorizeBooksByAdmin = (books) => {
    const categorized = {};
    books.forEach(book => {
      // ✅ FIX: Ensure sensitive data is removed for employee view
      const safeBook = role === "employee" ? { ...book, platforms: [] } : book;

      const adminName = safeBook.assignedBy?.name || 'Unknown Admin';
      const adminEmail = safeBook.assignedBy?.email || '';
      const adminKey = `${adminName} (${adminEmail})`;

      if (!categorized[adminKey]) {
        categorized[adminKey] = {
          adminInfo: safeBook.assignedBy,
          all: [],
          pending: [],
          approved: [],
          rejected: []
        };
      }

      categorized[adminKey].all.push(safeBook);

      const status = safeBook.status?.toLowerCase() || 'pending';
      if (categorized[adminKey][status]) {
        categorized[adminKey][status].push(safeBook);
      }
    });
    return categorized;
  };

  // ✅ Consolidated fetch data function
  const fetchData = async (queryFilters = filters, tab = activeTab) => {
    try {
      setLoading(true);

      // Prepare API parameters based on active tab
      let apiParams = { ...queryFilters };

      // Handle unassigned books - FIXED LOGIC
      if (tab === 'unassigned') {
        apiParams.keyword = "unassigned";
        apiParams.search = ""; // Clear search for unassigned
        apiParams.status = ""; // Clear status for unassigned
      } else if (tab !== 'all') {
        // For status tabs (pending, approved, rejected)
        apiParams.status = tab;
        apiParams.keyword = ""; // Clear keyword for status tabs
        apiParams.search = queryFilters.search || ""; // Keep existing search if any
      } else {
        // For 'all' tab, use existing search and clear keyword
        apiParams.search = queryFilters.search || "";
        apiParams.keyword = "";
      }

      // For assigned books (employee view)
      if (role === "employee") {
        apiParams.keyword = "assigned";
        apiParams.search = ""; // Clear search for employee view
        apiParams.status = ""; // Clear status for employee view - employee tabs handle filtering client-side
      }

      console.log("📡 API call with params:", apiParams);

      let response;
      let booksData = [];
      let pagination = {};

      if (role === "employee") {
        response = await getAssignedBooks(apiParams, userId);

        if (response?.status) {
          // Map assigned books to include admin info
          booksData = response.data.map(item => ({
            ...item.book,
            assignedAt: item.assignedAt,
            assignedBy: item.assignedBy,
            assignmentId: item.assignmentId,
          }));

          // Categorize books by admin
          const categorized = categorizeBooksByAdmin(booksData);
          setCategorizedData(categorized);

          pagination = {
            page: response.pagination?.page || 1,
            limit: response.pagination?.limit || apiParams.limit || 10,
            totalPages: response.pagination?.totalPages || 1,
            total: response.pagination?.total || booksData.length,
          };
        }
      } else {
        response = await getAllBooks(apiParams);

        if (response?.status) {
          booksData = response.data;
          pagination = {
            page: response.pagination?.page || apiParams.page,
            limit: response.pagination?.limit || apiParams.limit,
            totalPages: response.pagination?.totalPages || 1,
            total: response.pagination?.total || booksData.length,
          };
        }
      }

      // ✅ FIX: Hide platforms data for employees in the general view as well
      const sanitizedData = role === "employee" 
        ? booksData.map(book => ({ ...book, platforms: [] }))
        : booksData;
      
      setData(sanitizedData);
      setPaginationData(pagination);

    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
      setPaginationData({
        page: 1,
        limit: limit,
        totalPages: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ SINGLE INITIALIZATION EFFECT - runs only once
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      // Check for saved state first
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('booksListState');

        if (saved) {
          try {
            const savedState = JSON.parse(saved);
            console.log("🔄 Restoring state:", savedState);

            // Restore states
            if (savedState.activeTab) setActiveTab(savedState.activeTab);
            if (savedState.searchKeyword !== undefined) setSearchKeyword(savedState.searchKeyword);
            if (savedState.currentSort !== undefined) setCurrentSort(savedState.currentSort);

            // Restore pagination
            if (savedState.page) dispatch(setPage(savedState.page));
            if (savedState.limit) dispatch(setLimit(savedState.limit));

            // Restore filters
            const restoredFilters = {
              search: savedState.searchKeyword || "",
              keyword: savedState.activeTab === 'unassigned' ? "unassigned" : "",
              status: savedState.activeTab === 'all' || savedState.activeTab === 'unassigned' ? "" : savedState.activeTab,
              sort: savedState.currentSort || "",
              page: savedState.page || 1,
              limit: savedState.limit || 12,
            };

            console.log("✅ Restored filters:", restoredFilters);
            setFilters(restoredFilters);

            // Fetch with restored state
            await fetchData(restoredFilters, savedState.activeTab);

            // Clean up
            sessionStorage.removeItem('booksListState');
          } catch (e) {
            console.warn('Failed to restore books list state:', e);
            // Fallback to default fetch
            await fetchDefaultData();
          }
        } else {
          // No saved state, fetch default data
          await fetchDefaultData();
        }
      } else {
        // Server-side, fetch default data
        await fetchDefaultData();
      }

      setIsInitialized(true);
    };

    const fetchDefaultData = async () => {
      // For employees, wait for userId
      if (role === 'employee') {
        if (userId !== null) {
          await fetchData(filters, activeTab);
        }
      } else {
        // For non-employees/admins, fetch immediately
        await fetchData(filters, activeTab);
      }
    };

    initializeData();
  }, [role, userId, isInitialized]);

  // ✅ Effect to handle employee userId availability
  useEffect(() => {
    if (isInitialized && role === 'employee' && userId !== null) {
      fetchData(filters, activeTab);
    }
  }, [userId, isInitialized, role]);

  const confirmDeleteBook = (bookId) => {
    console.log("🗑 Confirm delete triggered for bookId:", bookId);
    setBookToDelete(bookId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      console.log("🛠 Deleting book with ID:", bookToDelete);
      const response = await deleteBook(bookToDelete);

      console.log("✅ Delete response:", response);

      // Refresh the list after delete
      fetchData(filters, activeTab);
    } catch (err) {
      console.error("❌ Error deleting book:", err);
    } finally {
      setConfirmOpen(false);
      setBookToDelete(null);
    }
  };

  // ✅ FIXED: Create stable debounced handler using useCallback
  const debouncedFilterHandler = useCallback(
    debounce((search, status, pageValue, limitValue, sort) => {
      console.log("🎯 Debounced filter handler called with:", { search, status, pageValue, limitValue, sort });

      const newFilters = {
        search: search !== undefined ? search : filters.search,
        keyword: filters.keyword,
        status: status !== undefined ? status : filters.status,
        sort: sort !== undefined ? sort : currentSort,
        page: pageValue !== undefined ? pageValue : page,
        limit: limitValue !== undefined ? limitValue : limit,
      };

      console.log("🚀 Final filters to be applied:", newFilters);

      setFilters(newFilters);
      setSearchKeyword(newFilters.search);
      setCurrentSort(newFilters.sort);

      fetchData(newFilters, activeTab);

      if (pageValue !== undefined) dispatch(setPage(pageValue));
      if (limitValue !== undefined) dispatch(setLimit(limitValue));
    }, 500), // Increased debounce time to 500ms
    [filters.search, filters.keyword, filters.status, currentSort, activeTab, dispatch, page, limit]
  );

  // ✅ FIXED: Immediate filter handler for non-search operations
  const immediateFilterHandler = useCallback(
    (search, status, pageValue, limitValue, sort) => {
      console.log("🎯 Immediate filter handler called with:", { search, status, pageValue, limitValue, sort });

      const newFilters = {
        search: search !== undefined ? search : filters.search,
        keyword: filters.keyword,
        status: status !== undefined ? status : filters.status,
        sort: sort !== undefined ? sort : currentSort,
        page: pageValue !== undefined ? pageValue : page,
        limit: limitValue !== undefined ? limitValue : limit,
      };

      console.log("🚀 Final filters to be applied:", newFilters);

      setFilters(newFilters);
      setSearchKeyword(newFilters.search);
      setCurrentSort(newFilters.sort);

      fetchData(newFilters, activeTab);

      if (pageValue !== undefined) dispatch(setPage(pageValue));
      if (limitValue !== undefined) dispatch(setLimit(limitValue));
    },
    [filters.search, filters.keyword, filters.status, currentSort, activeTab, dispatch, page, limit]
  );

  // ✅ NEW: Handle search input specifically with proper debouncing
  const handleSearchInput = useCallback((searchValue) => {
    setSearchKeyword(searchValue);

    // Reset to first page when searching
    dispatch(setPage(1));

    // Use debounced handler for search to avoid multiple API calls
    debouncedFilterHandler(
      searchValue,
      activeTab === 'all' || activeTab === 'unassigned' ? '' : activeTab,
      1,
      limit,
      currentSort
    );
  }, [activeTab, limit, currentSort, dispatch, debouncedFilterHandler]);

  const handleNavigateToBook = (bookId) => {
    // Store the current state before navigation
    const currentState = {
      activeTab: activeTab,
      searchKeyword: searchKeyword,
      currentSort: currentSort,
      page: page,
      limit: limit,
    };

    console.log("📦 Storing state before navigation:", currentState);
    sessionStorage.setItem('booksListState', JSON.stringify(currentState));

    router.push(`/books/${bookId}`);
  };

  // ✅ Improved tab handler - FIXED: properly handle employee vs admin tabs
  const handleTabClick = (tabKey) => {
    console.log("🎯 Tab clicked:", tabKey);

    // Update active tab immediately
    setActiveTab(tabKey);

    // Reset to first page when changing tabs
    dispatch(setPage(1));

    if (role === "employee") {
      // For employees, we filter client-side from categorized data
      // No API call needed, just update the active tab
      console.log("👨‍💼 Employee tab change - filtering client-side");
    } else {
      // For admins, prepare new filters for the tab
      const newFilters = {
        ...filters,
        page: 1,
        // Clear search when switching to special tabs
        search: tabKey === 'unassigned' ? "" : filters.search,
        // Set keyword only for unassigned, clear for others
        keyword: tabKey === 'unassigned' ? "unassigned" : "",
        status: tabKey === 'all' || tabKey === 'unassigned' ? '' : tabKey,
      };

      console.log("🔄 New filters for tab:", newFilters);

      setFilters(newFilters);
      setSearchKeyword(newFilters.search);
      fetchData(newFilters, tabKey);
    }
  };

  // Status counts for employee tabs
  const getStatusCounts = () => {
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
    Object.values(categorizedData).forEach(adminData => {
      counts.all += adminData.all.length;
      counts.pending += adminData.pending.length;
      counts.approved += adminData.approved.length;
      counts.rejected += adminData.rejected.length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // ✅ FIXED: Get filtered data for employee view
  const getFilteredDataForEmployee = () => {
    if (activeTab === 'all') {
      // Return all books from all admins
      const allBooks = [];
      Object.values(categorizedData).forEach(adminData => {
        allBooks.push(...adminData.all);
      });
      return allBooks;
    } else {
      // Return books filtered by status from all admins
      const filteredBooks = [];
      Object.values(categorizedData).forEach(adminData => {
        if (adminData[activeTab]) {
          filteredBooks.push(...adminData[activeTab]);
        }
      });
      return filteredBooks;
    }
  };

  const EmployeeCategorizedView = () => {
    const employeeFilteredData = getFilteredDataForEmployee();

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {[{ key: 'all', label: 'All Books', color: 'bg-gray-100 text-gray-700' },
            { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
            { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
            { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : `${tab.color} hover:shadow-md`
                  }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${activeTab === tab.key
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/50'
                  }`}>{statusCounts[tab.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {employeeFilteredData.length > 0 ? (
          Object.entries(categorizedData).map(([adminKey, adminData]) => {
            const booksToShow = activeTab === 'all' ? adminData.all : adminData[activeTab] || [];
            if (booksToShow.length === 0) return null;

            return (
              <div key={adminKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {adminData.adminInfo?.name || 'Unknown Admin'}
                      </h3>
                      <p className="text-sm text-gray-600">{adminData.adminInfo?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {booksToShow.length} {booksToShow.length === 1 ? 'book' : 'books'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className={`${viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'flex flex-col space-y-4'
                    }`}>
                    {booksToShow.map((book, index) => (
                      <div key={book._id || book.id || index} className="transform transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <Card data={book} variant={book.status} onNavigate={handleNavigateToBook} viewMode={viewMode} role={role} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="mb-6">
              <svg className="mx-auto w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No {activeTab !== 'all' ? activeTab : ''} books found
            </h3>
            <p className="text-gray-500">Check back later or contact your administrator.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout role={role}>
      <div className="p-10 mt-16 lg:mt-0">
        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                📚 {role === 'employee' ? 'My Assigned Books' : 'Book Library'}
              </h1>
              {paginationData && (
                <span className="text-xs ml-10 text-gray-500">
                  {paginationData.total || data.length} total books
                </span>
              )}
            </div>

            {/* Center Section - Search Bar */}
            {role !== 'employee' && (
              <div className="flex-1 md:max-w-md w-full text-[14px] min-w-[220px]">
                <FilterBar
                  data={data}
                  sort={true}
                  handler={(search, status, page, limit, sort) => {
                    // ✅ For non-search operations, use immediate handler
                    if (status !== undefined || page !== undefined || limit !== undefined || sort !== undefined) {
                      immediateFilterHandler(search, status, page, limit, sort);
                    } else {
                      // For search operations, use the debounced handler via handleSearchInput
                      handleSearchInput(search);
                    }
                  }}
                  debouncedHandler={(search, status, page, limit, sort) => {
                    // ✅ Use debounced handler for search
                    debouncedFilterHandler(search, status, page, limit, sort);
                  }}
                  currentFilters={{
                    search: searchKeyword,
                    status: activeTab === 'all' || activeTab === 'unassigned' ? '' : activeTab,
                    sort: currentSort,
                    page: filters.page,
                    limit: filters.limit
                  }}
                  placeholder="Search books..."
                  disabled={false}
                />
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "grid" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Add Book Button (Restored from previous context) */}
              <Button
                variant="secondary"
                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => router.push("/books/create")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                </svg>
                Add Book
              </Button>

            </div>
          </div>
        </div>

        {/* Books Display Section */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
              <div className="flex flex-col items-center justify-center text-center space-y-6">

                <Image
                  alt="dream-logo"
                  src="/images/dream-book-logo.png"
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

          ) : role === 'employee' ? (
            <EmployeeCategorizedView />
          ) : (
            <>
              {/* ✅ Tabs for non-employees */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All Books", color: "bg-gray-100 text-gray-700" },
                    { key: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
                    { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
                    { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
                    { key: "unassigned", label: "🚫 Unassigned Books", color: "bg-rose-100 text-rose-700" }
                  ]
                    .filter(tab => role === "admin" || tab.key !== "unassigned")
                    .map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabClick(tab.key)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab.key
                          ? "bg-indigo-600 text-white shadow-lg"
                          : `${tab.color} hover:shadow-md hover:scale-105`
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                </div>
              </div>

              {data.length > 0 ? (
                <div className={`transition-all duration-500 ease-in-out ${viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
                  : 'flex flex-col space-y-4'
                  }`}>
                  {data.map((book, index) => (
                    <div
                      key={book._id || book.id || index}
                      className="transform transition-all duration-300 hover:scale-[1.02] animate-fade-in opacity-0"
                      style={{
                        animationDelay: `${index * 60}ms`,
                        animationFillMode: "forwards"
                      }}
                    >
                      <Card
                        data={book}
                        variant={book.status}
                        role={role}
                        handledeleteBook={() => confirmDeleteBook(book.id)}
                        viewMode={viewMode}
                        onNavigate={handleNavigateToBook}
                        className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="mb-6">
                    <svg className="mx-auto w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
                  <p className="text-gray-500">
                    {activeTab === 'unassigned'
                      ? 'No unassigned books available.'
                      : activeTab !== 'all'
                        ? `No ${activeTab} books found.`
                        : 'Try adjusting your search criteria or add some books to get started.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && paginationData && paginationData.totalPages > 1 && !(role === 'employee') && (
          <div className="mt-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
            <Pagination
              filters={filters}
              data={paginationData}
              handler={immediateFilterHandler}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Delete</h2>
            <p className="text-gray-600 mt-2">Are you sure you want to delete this book?</p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
      `}</style>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const role = req.cookies._r || null;
  return { props: { role } };
}