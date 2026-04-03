"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookPlus } from "lucide-react";
import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
}

export default function ReadingRoutinePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const gid = localStorage.getItem("group_id");
      setGroupId(gid);

      if (!gid) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("books")
        .select("id, title, author, thumbnail")
        .eq("group_id", gid)
        .order("registered_at", { ascending: false });

      setBooks(data ?? []);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  return (
    <>
      <Header
        title="독서"
        backHref={groupId ? `/group/${groupId}/routines` : undefined}
      />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">책을 선택하고 독후감을 남겨요</p>
            <Link
              href="/books/add"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 active:bg-gray-50"
            >
              <BookPlus size={14} />
              책 추가
            </Link>
          </div>

          {books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-sm text-gray-400">아직 등록된 책이 없어요</p>
            </div>
          ) : (
            books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 active:bg-gray-50"
              >
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="h-16 w-11 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-gray-100 text-xl">
                    📚
                  </div>
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {book.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{book.author}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  );
}
