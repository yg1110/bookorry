"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

interface KakaoBook {
  title: string;
  authors: string[];
  thumbnail: string;
  isbn: string;
}

export default function AddBookPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGroupId(localStorage.getItem("group_id"));
  }, [pathname]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function search(q: string) {
    setSearching(true);
    try {
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.documents ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister(book: KakaoBook) {
    if (!groupId) return;
    setRegistering(book.isbn);

    const { error } = await supabase.from("books").insert({
      group_id: groupId,
      title: book.title,
      author: book.authors.join(", "),
      thumbnail: book.thumbnail || null,
    });

    if (!error) {
      setDone(book.isbn);
      setTimeout(() => {
        const gid = localStorage.getItem("group_id");
        router.push(gid ? `/group/${gid}?tab=books` : "/");
      }, 1200);
    }
    setRegistering(null);
  }

  async function handleManualRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId || !manualTitle.trim()) return;
    setManualLoading(true);

    const { error } = await supabase.from("books").insert({
      group_id: groupId,
      title: manualTitle.trim(),
      author: manualAuthor.trim() || null,
      thumbnail: null,
    });

    setManualLoading(false);
    if (!error) {
      const gid = localStorage.getItem("group_id");
      router.push(gid ? `/group/${gid}?tab=books` : "/");
    }
  }

  return (
    <>
      <Header
        title="책 추가"
        backHref={groupId ? `/group/${groupId}` : undefined}
      />
      <main className="flex flex-col px-4 pb-24 pt-4">
      <div className="mx-auto w-full max-w-md space-y-4">

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="책 제목 또는 저자 검색"
          className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none focus:border-black"
          autoFocus
        />

        {searching && (
          <p className="text-center text-sm text-gray-400">검색 중...</p>
        )}

        {!searching && results.length === 0 && query.trim() && !manualMode && (
          <div className="space-y-2 text-center">
            <p className="text-sm text-gray-400">검색 결과가 없어요.</p>
            <button
              type="button"
              onClick={() => {
                setManualTitle(query);
                setManualMode(true);
              }}
              className="text-sm font-medium text-black underline underline-offset-4"
            >
              직접 입력하기
            </button>
          </div>
        )}

        {manualMode && (
          <form onSubmit={handleManualRegister} className="space-y-3 rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold">직접 입력</p>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="책 제목 *"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
              required
            />
            <input
              type="text"
              value={manualAuthor}
              onChange={(e) => setManualAuthor(e.target.value)}
              placeholder="저자 (선택)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={manualLoading || !manualTitle.trim()}
                className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {manualLoading ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        )}

        <ul className="space-y-3">
          {results.map((book) => (
            <li
              key={book.isbn}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
            >
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="h-16 w-11 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                  📚
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {book.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {book.authors.join(", ")}
                </p>
              </div>

              <button
                onClick={() => handleRegister(book)}
                disabled={!!registering || !!done}
                className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {done === book.isbn ? "등록됨 ✓" : registering === book.isbn ? "..." : "등록"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
    </>
  );
}
