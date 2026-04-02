"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, BookPlus, Newspaper, PenLine, Plus, UserRoundPlus, X } from "lucide-react";

const APP_PATHS = ["/group/", "/books/", "/reviews/", "/members/"];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [lastBookId, setLastBookId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setGroupId(localStorage.getItem("group_id"));
    setLastBookId(localStorage.getItem("last_book_id"));
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
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
      {/* 딤 배경 */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB 메뉴 */}
      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <>
            <Link
              href="/books/add"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ring-gray-100"
            >
              <BookPlus size={18} />
              책 추가
            </Link>
            {lastBookId ? (
              <Link
                href={`/books/${lastBookId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ring-gray-100"
              >
                <PenLine size={18} />
                독후감 쓰기
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-gray-300 shadow-lg ring-1 ring-gray-100">
                <PenLine size={18} />
                독후감 쓰기
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          {open ? <X size={26} /> : <Plus size={26} />}
        </button>
      </div>

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
