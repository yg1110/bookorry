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
  registered_at: string;
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
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const [groupRes, booksRes, membersRes] = await Promise.all([
        supabase.from("groups").select("id, name, invite_code").eq("id", id).single(),
        supabase.from("books").select("id, title, author, thumbnail, registered_at").eq("group_id", id).order("registered_at", { ascending: false }),
        supabase.from("members").select("id, nickname").eq("group_id", id).order("created_at", { ascending: true }),
      ]);

      if (groupRes.error || !groupRes.data) {
        router.replace("/");
        return;
      }

      setGroup(groupRes.data);
      setBooks(booksRes.data ?? []);
      setMembers(membersRes.data ?? []);
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
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <button
              onClick={handleCopy}
              className="mt-1 text-xs text-gray-400"
            >
              {copied ? "복사됐어요 ✓" : `초대코드: ${group.invite_code}`}
            </button>
          </div>
          <Link
            href={`/books/add`}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            + 책 추가
          </Link>
        </div>

        {/* 멤버 */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            멤버 {members.length}명
          </h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm"
              >
                {m.nickname}
              </span>
            ))}
          </div>
        </section>

        {/* 책 목록 */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            읽은 책 {books.length}권
          </h2>

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
            <ul className="space-y-3">
              {books.map((book) => (
                <li
                  key={book.id}
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
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {book.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{book.author}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
