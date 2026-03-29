"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  content: string;
  reviewed_at: string;
  members: { id: string; nickname: string; group_id: string } | null;
  books: { id: string; title: string; author: string; thumbnail: string | null } | null;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, content, reviewed_at, members(id, nickname, group_id), books(id, title, author, thumbnail)")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/");
        return;
      }

      setReview(data as Review);
      setLoading(false);
    }

    load();
  }, [id, router]);

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  if (!review) return null;

  return (
    <main className="flex min-h-svh flex-col px-4 pb-24 pt-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400">
          ← 뒤로
        </button>

        {/* 책 정보 */}
        {review.books && (
          <Link
            href={`/books/${review.books.id}`}
            className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3"
          >
            {review.books.thumbnail ? (
              <img
                src={review.books.thumbnail}
                alt={review.books.title}
                className="h-14 w-10 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-gray-200 text-lg">
                📚
              </div>
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold">{review.books.title}</p>
              <p className="text-xs text-gray-400">{review.books.author}</p>
            </div>
          </Link>
        )}

        {/* 작성자 + 날짜 */}
        <div className="flex items-center justify-between">
          {review.members ? (
            <Link
              href={`/members/${review.members.id}`}
              className="text-sm font-semibold underline decoration-dotted"
            >
              {review.members.nickname}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-gray-400">알 수 없음</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(review.reviewed_at).toLocaleString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* 본문 */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
      </div>
    </main>
  );
}
