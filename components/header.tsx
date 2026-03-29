"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, back = true, right }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-gray-100 bg-white/95 px-2 backdrop-blur-sm">
      <div className="w-10">
        {back && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
          >
            <ChevronLeft size={22} />
          </button>
        )}
      </div>

      <h1 className="flex-1 truncate text-center text-sm font-semibold">
        {title}
      </h1>

      <div className="flex w-10 justify-end">{right}</div>
    </header>
  );
}
