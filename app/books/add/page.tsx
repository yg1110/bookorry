"use client";

import { useRouter } from "next/navigation";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGroupId(localStorage.getItem("group_id"));
  }, []);

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
        router.push(gid ? `/group/${gid}` : "/");
      }, 1200);
    }
    setRegistering(null);
  }

  return (
    <>
      <Header title="책 추가" />
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

        {!searching && results.length === 0 && query.trim() && (
          <p className="text-center text-sm text-gray-400">검색 결과가 없어요.</p>
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
