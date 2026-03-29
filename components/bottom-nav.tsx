"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookPlus, Newspaper, UserRoundPlus } from "lucide-react";

const APP_PATHS = ["/group/", "/books/", "/reviews/", "/members/"];

export function BottomNav() {
  const pathname = usePathname();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    setGroupId(localStorage.getItem("group_id"));
  }, []);

  const visible = APP_PATHS.some((p) => pathname.startsWith(p));
  if (!visible || !groupId) return null;

  const items = [
    {
      href: `/group/${groupId}`,
      icon: <Newspaper size={22} />,
      label: "피드",
      active: pathname.startsWith("/group/"),
    },
    {
      href: "/books/add",
      icon: <BookPlus size={22} />,
      label: "책 추가",
      active: pathname === "/books/add",
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
