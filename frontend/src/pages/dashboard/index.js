import Layout from "@/layout/Layout";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getMonthlySales,
  getAuthoursdashboard,
  getAuthorSalestReport,
  getAuthorRoyaltyReport,
  getForAllAuthorRoyaltyReport
} from "../../services/APIs/dashboard";
import DashboardCards from "@/components/Dashboard/DashboardCards";
import SalesAnalytics from "@/components/Dashboard/SalesAnalytics";
import RoyaltyManagement from "@/components/Dashboard/RoyaltyManagement";
import RoyaltyReport from "@/components/Dashboard/RoyaltyReport";
import Loader from "@/modules/Loader";
import { permissionHandler } from "@/Utilities/permissions";
import AuthorMonthlySales from "@/components/Dashboard/AuthorMonthlySales";
import Image from 'next/image'

export default function Index({ role, id }) {
  console.log("Dashboard role:", role);
  const [stats, setStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [salesLoading, setSalesLoading] = useState(false);
  const [showRoyaltyReport, setShowRoyaltyReport] = useState(false);
  console.log("monthlySales", monthlySales)
  console.log("stats", stats)
  console.log("stats?.totalRoyalty ", stats?.totalRoyalty)
  const checkDashboardPermission = permissionHandler("dashboard", role);
  const isAuthor = role === "author";

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response.status) {
        setStats(response.data || {});
        // Set initial month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        setSelectedMonth(`${currentYear}-${currentMonth}`);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats for author
  const fetchAuthorsDashboard = async (id) => {
    try {
      setLoading(true);
      const response = await getAuthoursdashboard(id);
      if (response.status) {
        setStats(response.data || {});
      }
    } catch (error) {
      console.error("Error fetching authors dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthor) {
      fetchAuthorsDashboard(id);
    } else {
      fetchDashboardStats();
    }
  }, [role]);

  // Fetch monthly sales
  const fetchMonthlySales = async (month, year) => {
    try {
      setSalesLoading(true);
      if (isAuthor) {
        const response = await getAuthorSalestReport({ month, year, authorId: id });
        if (response.status) {
          setMonthlySales(response.data || []);
        }
        return;
      }
      const response = await getMonthlySales(month, year);
      if (response.status) {
        setMonthlySales(response.data || []);
      } else {
        setMonthlySales([]);
      }
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
      setMonthlySales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      const [yr, mon] = selectedMonth.split("-");
      fetchMonthlySales(mon, yr);
    }
  }, [selectedMonth]);

  // Parse date
  const getMonthFromDate = (dateStr) => {
    if (!dateStr) return "";
    const months = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    try {
      const parts = dateStr.split(" ");
      if (parts.length < 3) return "";
      return `${parts[2]}-${months[parts[1]] || "01"}`;
    } catch {
      return "";
    }
  };

  // Get all months between start and now
  const getAllMonthsTillNow = (startMonth) => {
    const result = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let [startYear, startMonthNum] = startMonth.split("-").map(Number);
    while (startYear < currentYear || (startYear === currentYear && startMonthNum <= currentMonth)) {
      result.push(`${startYear}-${String(startMonthNum).padStart(2, "0")}`);
      startMonthNum++;
      if (startMonthNum > 12) {
        startMonthNum = 1;
        startYear++;
      }
    }
    return result;
  };

  const getEarliestMonth = () => {
    const defaultStart = "2024-01";
    if (!stats?.salesReport || stats.salesReport.length === 0) return defaultStart;
    const months = stats.salesReport
      .map((item) => getMonthFromDate(item.date))
      .filter(Boolean);
    return months.length > 0 ? months.sort()[0] : defaultStart;
  };

  const allMonths = getAllMonthsTillNow(getEarliestMonth());

  const getFilteredSalesData = () => monthlySales || [];

  const getPlatformStats = () => {
    if (isAuthor) {
      // Return author’s monthly sales (already filtered)
      return getFilteredSalesData();
    }
    const filteredData = getFilteredSalesData();
    const platformMap = {};
    filteredData.forEach((item) => {
      if (!platformMap[item.platformName]) {
        platformMap[item.platformName] = { platform: item.platformName, quantity: 0, total: 0 };
      }
      platformMap[item.platformName].quantity += item.quantity || 0;
      const earnings = parseFloat(item.profitsEarned?.replace(/[₹,]/g, "") || 0);
      platformMap[item.platformName].total += earnings;
    });
    return Object.values(platformMap).map((p) => ({
      ...p,
      total: `₹${p.total.toFixed(2)}`,
    }));
  };

  const getTotalSales = () => {
    if (isAuthor) {
      return stats?.totalSale || 0;
    }
    const platformStats = getPlatformStats();
    return platformStats.reduce((sum, p) => sum + parseFloat(p.total.replace(/[₹,]/g, "") || 0), 0);
  };

  useEffect(() => {
    if (allMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(allMonths[allMonths.length - 1]);
    }
  }, [allMonths, selectedMonth]);

  // Responsive card text depending on role
  const dashboardCards = isAuthor
    ? [
      // {
      //   title: "My Earnings",
      //   value: stats?.platformEarnings || "₹0",
      //   icon: "💰",
      //   bgGradient: "from-emerald-500 to-cyan-500",
      // },
      {
        title: "My Royalty",
        value: stats?.totalRoyalty || "₹0",
        icon: "👑",
        bgGradient: "from-orange-500 to-red-500",
      },
      {
        title: "My Books",
        value: stats?.totalBooks || "0",
        icon: "📚",
        bgGradient: "from-purple-500 to-pink-500",
      },
      {
        title: "My Sales",
        value: stats?.totalSales || "0",
        icon: "📈",
        bgGradient: "from-blue-500 to-indigo-500",
      },
    ]
    : [
      {
        title: "Platform Earnings",
        value: stats?.platformEarnings || "₹0",
        icon: "💰",
        bgGradient: "from-emerald-500 to-cyan-500",
      },
      {
        title: "Total Royalty",
        value: stats?.totalRoyalty || "₹0",
        icon: "👑",
        bgGradient: "from-orange-500 to-red-500",
      },
      {
        title: "Total Books",
        value: stats?.totalBooks || "0",
        icon: "📚",
        bgGradient: "from-purple-500 to-pink-500",
      },
      {
        title: "Total Sales",
        value: stats?.totalSales || "0",
        icon: "📈",
        bgGradient: "from-blue-500 to-indigo-500",
      },
      {
        title: "Total Authors",
        value: stats?.totalAuthors || "0",
        icon: "✍️",
        bgGradient: "from-amber-500 to-orange-500",
      },
    ];

  // if (loading) {
  //   return (
  //     <Layout role={role}>
  //       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
  //         <div className="text-center space-y-6">

  //           <Loader />
  //           {/* <Image alt="dream-logo" src='/images/dream-book-logo.png' width={126} height={56} className="object-contain" /> */}

  //           <div className="space-y-2">
  //             <h2 className="text-2xl font-bold text-gray-800">DreamBook Publishing</h2>
  //             <p className="text-gray-600 text-sm sm:text-base">Please wait while we fetch your data...</p>
  //           </div>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }


  if (loading) {
  return (
    <Layout role={role}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {/* Centered Logo */}
          <div className="flex justify-center">
            <Image
              alt="dream-logo"
              src="/images/dream-book-logo.png"
              width={140}
              height={60}
              className="object-contain"
            />
          </div>

          {/* Text Section */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              DreamBook Publishing
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

  return (
    <Layout role={role}>
      <div className="min-h-screen bg-gray-50">

        <div className="space-y-6 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0 max-w-7xl mx-auto">
          {/* Simple Hero Section */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {isAuthor ? "Welcome Back, Author!" : "Welcome Back!"}
            </h1>
            <p className="text-indigo-100">
              {isAuthor
                ? "Track your book performance and earnings"
                : "Monitor platform performance and manage authors"}
            </p>
          </div>

          {/* Dashboard Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
            <DashboardCards cards={dashboardCards} />
          </div>

          {/* Sales Analytics */}
          <div>
            <SalesAnalytics
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              allMonths={allMonths}
              getPlatformStats={getPlatformStats}
              getTotalSales={getTotalSales}
              loading={salesLoading}
              monthlySales={monthlySales}
              role={role}
            />
          </div>

          {/* Royalty Report Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {isAuthor ? "📊 My Royalty Report" : "📈 Authors Royalty Report"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isAuthor
                    ? "View detailed breakdown of your book royalties"
                    : "Manage and view royalty reports for all authors"}
                </p>
              </div>
              <button
                onClick={() => setShowRoyaltyReport(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Royalty Report Modal */}
      <RoyaltyReport
        role={role}
        authorId={id}
        isOpen={showRoyaltyReport}
        onClose={() => setShowRoyaltyReport(false)}
      />
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const role = req.cookies._r || null;
  let id = null;

  if (req.cookies.user) {
    try {
      const user = JSON.parse(req.cookies.user);
      id = user._id || null;
    } catch (err) {
      console.error("Failed to parse user cookie:", err);
    }
  }

  if (!role) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { role, id } };
}
