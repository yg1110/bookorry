"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const groupId = localStorage.getItem("group_id");
    const sessionToken = localStorage.getItem("session_token");
    if (groupId && sessionToken) {
      router.replace(`/group/${groupId}`);
      return;
    }
    setReady(true);
  }, [router]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    localStorage.removeItem("group_id");
    localStorage.removeItem("session_token");
    localStorage.removeItem("member_id");
    localStorage.removeItem("invite_code");
    localStorage.removeItem("nickname");
    router.push(`/join?code=${encodeURIComponent(trimmed)}`);
  }

  if (!ready) return null;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">📚 부코리</h1>
        <p className="mt-2 text-sm text-gray-500">북클럽 독후감을 함께 기록해요</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/create"
          className="block w-full rounded-2xl bg-black py-4 text-center text-sm font-semibold text-white"
        >
          그룹 만들기
        </Link>

        <div className="relative flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="초대코드 입력 (예: BOOK-A1B2)"
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="w-full rounded-2xl border border-black py-4 text-sm font-semibold text-black"
          >
            참여하기
          </button>
        </form>
      </div>
    </main>
  );
}
