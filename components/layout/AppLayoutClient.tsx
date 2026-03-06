"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

const SIDEBAR_PATHS = [
  "/dashboard",
  "/developers",
  "/messages",
  "/workspace",
  "/profile",
  "/tests",
  "/admin",
];

function useShowSidebar() {
  const pathname = usePathname();
  return SIDEBAR_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const showSidebar = useShowSidebar();

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
