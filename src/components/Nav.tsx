"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/events", label: "Events", icon: "📋" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/archive", label: "Archive", icon: "🗄️" },
  { href: "/settings", label: "Settings", icon: "⚙️", adminOnly: true },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 bg-yale-blue flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-white font-display font-bold text-lg leading-tight">
          Policy LC
          <span className="block text-yale-light text-xs font-normal tracking-wide mt-0.5">
            Ops Hub
          </span>
        </h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          if ("adminOnly" in item && item.adminOnly && (session.user as any).role !== "ADMIN") return null;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-white text-sm font-medium truncate">{session.user.name}</div>
        <div className="text-white/50 text-xs truncate">{session.user.role}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 text-white/60 text-xs hover:text-white transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
