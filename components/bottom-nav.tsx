"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, Newspaper, Plus, UserRoundPlus } from "lucide-react";

const APP_PATHS = ["/group/", "/books/", "/reviews/", "/members/"];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      active: pathname.startsWith("/group/") && searchParams.get("tab") !== "books",
    },
    {
      href: `/group/${groupId}?tab=books`,
      icon: <BookOpen size={22} />,
      label: "책 목록",
      active: pathname.startsWith("/books/") || (pathname.startsWith("/group/") && searchParams.get("tab") === "books"),
    },
    {
      href: `/join`,
      icon: <UserRoundPlus size={22} />,
      label: "그룹 참여",
      active: pathname === "/join",
    },
  ];

  return (
    <>
      <Link
        href="/books/add"
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg"
      >
        <Plus size={26} />
      </Link>

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
    </>
  );
}
