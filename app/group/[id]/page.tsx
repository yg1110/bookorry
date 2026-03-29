"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
}

interface Member {
  id: string;
  nickname: string;
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
}

interface FeedItem {
  id: string;
  content: string;
  created_at: string;
  members: { nickname: string } | null;
  books: { id: string; title: string; thumbnail: string | null } | null;
}

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"feed" | "books">("feed");

  useEffect(() => {
    async function load() {
      const [groupRes, booksRes, membersRes, feedRes] = await Promise.all([
        supabase.from("groups").select("id, name, invite_code").eq("id", id).single(),
        supabase.from("books").select("id, title, author, thumbnail").eq("group_id", id).order("registered_at", { ascending: false }),
        supabase.from("members").select("id, nickname").eq("group_id", id).order("created_at", { ascending: true }),
        supabase
          .from("reviews")
          .select("id, content, created_at, members(nickname), books(id, title, thumbnail)")
          .eq("books.group_id", id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (groupRes.error || !groupRes.data) {
        router.replace("/");
        return;
      }

      setGroup(groupRes.data);
      setBooks(booksRes.data ?? []);
      setMembers(membersRes.data ?? []);
      setFeed((feedRes.data as FeedItem[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id, router]);

  async function handleCopy() {
    if (!group) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  if (!group) return null;

  return (
    <main className="flex min-h-svh flex-col px-4 pb-24 pt-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <button onClick={handleCopy} className="mt-1 text-xs text-gray-400">
              {copied ? "복사됐어요 ✓" : `초대코드: ${group.invite_code}`}
            </button>
          </div>
          <Link
            href="/books/add"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            + 책 추가
          </Link>
        </div>

        {/* 멤버 */}
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span
              key={m.id}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs"
            >
              {m.nickname}
            </span>
          ))}
        </div>

        {/* 탭 */}
        <div className="flex gap-4 border-b border-gray-100">
          <button
            onClick={() => setTab("feed")}
            className={`pb-2 text-sm font-semibold ${tab === "feed" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
          >
            독후감 피드
          </button>
          <button
            onClick={() => setTab("books")}
            className={`pb-2 text-sm font-semibold ${tab === "books" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
          >
            책 목록 {books.length}
          </button>
        </div>

        {/* 피드 탭 */}
        {tab === "feed" && (
          <section className="space-y-3">
            {feed.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">아직 독후감이 없어요</p>
                <p className="mt-1 text-xs text-gray-300">책을 추가하고 독후감을 남겨보세요</p>
              </div>
            ) : (
              feed.map((item) => (
                <Link
                  key={item.id}
                  href={`/books/${item.books?.id}`}
                  className="block rounded-2xl bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-center gap-2">
                    {item.books?.thumbnail && (
                      <img
                        src={item.books.thumbnail}
                        alt={item.books.title}
                        className="h-8 w-6 rounded object-cover"
                      />
                    )}
                    <span className="text-xs text-gray-400 line-clamp-1">
                      {item.books?.title}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed">
                    {item.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {item.members?.nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </section>
        )}

        {/* 책 목록 탭 */}
        {tab === "books" && (
          <section className="space-y-3">
            {books.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
                <p className="text-sm text-gray-400">아직 등록된 책이 없어요</p>
                <Link
                  href="/books/add"
                  className="mt-3 inline-block text-sm font-semibold underline"
                >
                  첫 번째 책 추가하기
                </Link>
              </div>
            ) : (
              books.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
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
          </section>
        )}
      </div>
    </main>
  );
}
