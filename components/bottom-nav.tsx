"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Newspaper, UserRoundPlus } from "lucide-react";

const APP_PATHS = ["/group/", "/books/", "/reviews/", "/routines/"];

export function BottomNav() {
  const pathname = usePathname();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    setGroupId(localStorage.getItem("group_id"));
  }, [pathname]);

  const visible = APP_PATHS.some((p) => pathname.startsWith(p));
  if (!visible || !groupId) return null;

  const items = [
    {
      href: `/group/${groupId}`,
      icon: <Newspaper size={22} />,
      label: "피드",
      active:
        pathname.startsWith("/group/") && !pathname.includes("/routines"),
    },
    {
      href: `/group/${groupId}/routines`,
      icon: <ListChecks size={22} />,
      label: "루틴",
      active:
        pathname.includes("/routines") || pathname.startsWith("/routines/"),
    },
    {
      href: `/join`,
      icon: <UserRoundPlus size={22} />,
      label: "그룹 참여",
      active: pathname === "/join",
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-gray-100 bg-white/95 backdrop-blur-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            item.active ? "text-black" : "text-gray-400"
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
