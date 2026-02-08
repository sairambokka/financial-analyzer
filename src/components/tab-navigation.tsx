"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Uploads", href: "/uploads", icon: UploadCloud },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.name}</span>
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent-blue" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
