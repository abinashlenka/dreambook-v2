import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Button from "@/components/Button"
import useFirebaseAuth from "@/services/firebase-services/useFirebaseAuth"
import Author from "../../public/icons/author"
import NotificationBell from '@/modules/NotificationBell'
import { permissionHandler } from "@/Utilities/permissions"
import { FaUserPlus } from "react-icons/fa";
import { IoIosCloudUpload } from "react-icons/io";


export default function Navbar({ role, children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  // console.log("isMinimized",isMinimized)
  const { logOut } = useFirebaseAuth()

  const yesConfirmation = async () => {
    setLoading(true)
    const res = await logOut()
    if (res.status) {
      router.push("/")
    }
  }

  const isActiveHandler = (url = "") => router.asPath.includes(url)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const isMobileView = width < 1024
      setIsMobile(isMobileView)

      if (!isMobileView) {
        setIsMobileMenuOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router.asPath])

  // Escape key and body overflow
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false)
    }
    if (isMobileMenuOpen && isMobile) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen, isMobile])

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      permission: "dashboard",
      icon: (
        <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      )
    },
    {
      name: "Books",
      path: "/books",
      permission: "books",
      icon: (
        <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    },
    {
      name: "Authors",
      path: "/authors",
      permission: "authors",
      icon: <Author color="currentColor" size="20" />
    },
    {
      name: "Employee",
      path: "/employees",
      permission: "employees",
      icon: <FaUserPlus color="currentColor" size="20" />
    },
    {
      name: "Flipkart Data",
      path: "/flipkart",
      permission: "flipkart",
      icon: <IoIosCloudUpload color="currentColor" size="20" />
    },
    {
      name: "Settings",
      path: "/settings",
      permission: "settings",
      icon: (
        <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }


  ]

  return (
    <div className="min-h-screen bg-gray-100 h-screen dark:bg-neutral-900">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 w-full h-16 bg-white dark:bg-neutral-800 shadow-lg border-b border-gray-200 dark:border-neutral-700 z-40 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="p-2 -ml-2 mr-3 rounded-lg text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 active:bg-gray-200 dark:active:bg-neutral-600 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <img
              src="/images/dream-book-logo.png"
              alt="DreamBook Logo"
              className="h-8 object-contain"
            />
          </div>

          {/* Add NotificationBell to mobile header */}
          <div className="flex items-center">
            <NotificationBell role={role} />
          </div>
        </header>
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${!isMobile
            ? `fixed lg:sticky top-0 h-screen transition-all duration-300 ${isMinimized ? "w-16" : "w-64 xl:w-72 2xl:w-80"
            }`
            : "fixed top-0 left-0 w-4/5 max-w-xs h-full z-50"}
          bg-white dark:bg-neutral-800 shadow-xl border-r border-gray-200 dark:border-neutral-700 flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-neutral-700 px-4">
          {(!isMobile && !isMinimized) && (
            <img
              src="/images/dream-book-logo.png"
              alt="DreamBook Logo"
              className="h-14 object-contain"
            />
          )}

          {/* Desktop minimize toggle */}
          {!isMobile && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="flex justify-center items-center size-9 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`shrink-0 size-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M15 3v18" />
                <path d="m10 15-3-3 3-3" />
              </svg>
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex justify-center items-center size-8 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              if (!permissionHandler(item.permission, role)) return null

              const isActive = isActiveHandler(item.path)

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`
                      min-h-[44px] flex items-center gap-x-3 py-2.5 px-3 rounded-lg transition-all duration-200 group relative
                      ${isActive
                        ? "bg-[#5D60EF] dark:bg-blue-900/20 text-white dark:text-blue-300 font-medium shadow-sm"
                        : "text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                      }
                      ${isMinimized && !isMobile ? 'justify-center' : ''}
                    `}
                  >
                    <span className={`${isActive ? 'text-white dark:text-blue-400' : ''}`}>
                      {item.icon}
                    </span>
                    {(!isMinimized || isMobile) && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                    )}

                    {/* Tooltip for minimized state */}
                    {isMinimized && !isMobile && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full">
                          <div className="border-4 border-transparent border-r-gray-900 dark:border-r-neutral-700"></div>
                        </div>
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-gray-200 dark:border-neutral-700">
          <Button
            onClick={() => setConfirmation(true)}
            className={`
              w-full flex items-center gap-2 py-3 text-sm font-medium rounded-lg transition-all duration-200
              ${isMinimized && !isMobile ? 'justify-center px-2' : 'justify-center px-4'}
            `}
            variant="ghost"
          >
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            {(!isMinimized || isMobile) && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          transition-all duration-300 
          ${isMobile
            ? "w-full mt-16"
            : `${isMinimized ? 'ml-16' : 'ml-64 xl:ml-72 2xl:ml-80'}`
          }
        `}
      >
        <div className="">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {confirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-center mb-6">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setConfirmation(false)}
                variant="outline"
                className="px-4 py-2"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={yesConfirmation}
                loading={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}