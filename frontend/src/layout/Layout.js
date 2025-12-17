import { cn } from '@/Utilities/cn';
import Navbar from '@/modules/Navbar';
import SocialFooter from '@/modules/SocialFooter';
import NotificationBell from '@/modules/NotificationBell';

export default function Layout({ children, className, role }) {
  return (
    <div className={cn('flex w-full h-screen overflow-hidden', className)}>
      {/* Sidebar */}
      <Navbar role={role} />

      {/* ✅ Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100 h-screen">
        {/* Top Right Section */}
        <div className="w-full flex justify-end items-center p-3 bg-white px-4 lg:px-8 pt-4 shrink-0">
          <NotificationBell role={role} />
        </div>

        {/* Page Content (scrollable area) */}
        <div className="flex-1 overflow-y-auto  ">
          {children}
        </div>

        {/* Footer stays at bottom */}
        <div className="shrink-0">
          <SocialFooter />
        </div>
      </div>
    </div>
  );
}
