"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/mock-inbox", label: "Mock Inbox" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === link.href
                  ? "bg-amber-100 text-amber-800"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
