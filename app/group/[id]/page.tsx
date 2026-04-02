"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy } from "lucide-react";

import { KakaoShareButton } from "@/components/kakao-share-button";
import { Header } from "@/components/header";
import { formatDisplayDate } from "@/lib/format-display-date";
import { relationOne } from "@/lib/supabase-relations";
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
  reviewed_at: string;
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
  const searchParams = useSearchParams();

  const [group, setGroup] = useState<Group | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"feed" | "books">(
    searchParams.get("tab") === "books" ? "books" : "feed"
  );

  useEffect(() => {
    setTab(searchParams.get("tab") === "books" ? "books" : "feed");
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const [groupRes, booksRes, membersRes, feedRes] = await Promise.all([
        supabase
          .from("groups")
          .select("id, name, invite_code")
          .eq("id", id)
          .single(),
        supabase
          .from("books")
          .select("id, title, author, thumbnail")
          .eq("group_id", id)
          .order("registered_at", { ascending: false }),
        supabase
          .from("members")
          .select("id, nickname")
          .eq("group_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("reviews")
          .select(
            "id, content, reviewed_at, members(nickname), books(id, title, thumbnail)",
          )
          .eq("books.group_id", id)
          .order("reviewed_at", { ascending: false })
          .limit(30),
      ]);

      if (groupRes.error || !groupRes.data) {
        router.replace("/");
        return;
      }

      setGroup(groupRes.data);
      setBooks(booksRes.data ?? []);
      setMembers(membersRes.data ?? []);

      type FeedRow = Omit<FeedItem, "members" | "books"> & {
        members: FeedItem["members"] | NonNullable<FeedItem["members"]>[];
        books: FeedItem["books"] | NonNullable<FeedItem["books"]>[];
      };
      const rawFeed = (feedRes.data as FeedRow[] | null) ?? [];
      setFeed(
        rawFeed.map((row) => ({
          ...row,
          members: relationOne(row.members),
          books: relationOne(row.books),
        })),
      );
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
    <>
      <Header
        title={group.name}
        back={false}
        right={
          <button
            onClick={handleCopy}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
            title="초대코드 복사"
          >
            {copied ? (
              <span className="text-xs text-green-600">✓</span>
            ) : (
              <Copy size={18} />
            )}
          </button>
        }
      />
      <main className="flex flex-col px-4 pt-4 pb-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          <KakaoShareButton
            title={group.name}
            description={`독서 모임에 초대해요 · 멤버 ${members.length}명 · 책 ${books.length}권 · 링크로 참여 후 이 방으로 들어올 수 있어요`}
            path={`/group/${group.id}`}
            inviteCode={group.invite_code}
          />

          {/* 멤버 */}
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/members/${m.id}`}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs"
              >
                {m.nickname}
              </Link>
            ))}
          </div>

          {/* 탭 */}
          <div className="flex gap-4 border-b border-gray-100">
            <button
              onClick={() => router.replace(`/group/${id}`, { scroll: false })}
              className={`pb-2 text-sm font-semibold ${tab === "feed" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
            >
              독후감 피드
            </button>
            <button
              onClick={() => router.replace(`/group/${id}?tab=books`, { scroll: false })}
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
                  <p className="mt-1 text-xs text-gray-300">
                    책을 추가하고 독후감을 남겨보세요
                  </p>
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
                      <span className="line-clamp-1 text-xs text-gray-400">
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
                        {formatDisplayDate(item.reviewed_at)}
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
                  <p className="text-sm text-gray-400">
                    아직 등록된 책이 없어요
                  </p>
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
                      <p className="line-clamp-2 text-sm leading-snug font-medium">
                        {book.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {book.author}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
