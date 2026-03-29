"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  back?: boolean;
  /** 스택이 얕을 때(공유·초대 직후 등) 뒤로가기 대신 이동할 경로 */
  backHref?: string;
  right?: React.ReactNode;
}

export function Header({ title, back = true, backHref, right }: HeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref && typeof window !== "undefined") {
      const feedGid = sessionStorage.getItem("bookorry-back-to-feed");
      if (feedGid && backHref === `/group/${feedGid}`) {
        sessionStorage.removeItem("bookorry-back-to-feed");
        router.replace(backHref);
        return;
      }
      if (window.history.length <= 1) {
        router.replace(backHref);
        return;
      }
    }
    router.back();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-gray-100 bg-white/95 px-2 backdrop-blur-sm">
      <div className="w-10">
        {back && (
          <button
            type="button"
            onClick={handleBack}
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
