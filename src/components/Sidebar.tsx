"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "프로필", href: "/profiles" },
  { label: "레슨", href: "/lessons" },
  { label: "주문", href: "/orders" },
  { label: "쿠폰", href: "/coupons" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[200px] shrink-0 h-screen sticky top-0 bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-6 border-b border-gray-700">
        <span className="text-sm font-semibold tracking-wide text-white">
          LatinHouse Admin
        </span>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${
                isActive
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-indigo-500 rounded-r" />
              )}
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
