"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-64",
        )}
      >
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && user && user.role !== "LGU_ADMIN") {
      router.push("/citizen/report");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "LGU_ADMIN") return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
