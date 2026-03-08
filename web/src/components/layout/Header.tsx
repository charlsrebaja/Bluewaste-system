"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Bell, Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifPath = isAdmin
    ? "/dashboard/notifications"
    : "/citizen/my-reports";

  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">BW</span>
          </div>
          <span className="font-bold text-primary">BlueWaste</span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-gray-800">
            {isAdmin ? "Admin Dashboard" : "Citizen Portal"}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <Link
            href={notifPath}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadData && unreadData.count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadData.count > 9 ? "9+" : unreadData.count}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.firstName}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white py-2 px-4 space-y-1">
          {isAdmin ? (
            <>
              <MobileLink
                href="/dashboard"
                label="Dashboard"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/dashboard/reports"
                label="Reports"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/dashboard/map"
                label="Waste Map"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/dashboard/analytics"
                label="Analytics"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/dashboard/barangays"
                label="Barangays"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/dashboard/notifications"
                label="Notifications"
                onClick={() => setMobileMenuOpen(false)}
              />
            </>
          ) : (
            <>
              <MobileLink
                href="/citizen/report"
                label="Submit Report"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/citizen/my-reports"
                label="My Reports"
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLink
                href="/citizen/map"
                label="Waste Map"
                onClick={() => setMobileMenuOpen(false)}
              />
            </>
          )}
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}
