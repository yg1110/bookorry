"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
  group_id: string;
}

interface Review {
  id: string;
  content: string;
  created_at: string;
  members: { nickname: string } | null;
}

export default function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const sessionToken = localStorage.getItem("session_token");

      const [bookRes, reviewsRes] = await Promise.all([
        supabase.from("books").select("id, title, author, thumbnail, group_id").eq("id", id).single(),
        supabase
          .from("reviews")
          .select("id, content, created_at, members(nickname)")
          .eq("book_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (bookRes.error || !bookRes.data) {
        router.replace("/");
        return;
      }

      setBook(bookRes.data);
      setReviews((reviewsRes.data as Review[]) ?? []);

      if (sessionToken) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", sessionToken)
          .single();
        if (member) setMemberId(member.id);
      }

      setLoading(false);
    }

    load();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !memberId || !book) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert({ book_id: book.id, member_id: memberId, content: content.trim() })
      .select("id, content, created_at, members(nickname)")
      .single();

    if (!error && data) {
      setReviews((prev) => [data as Review, ...prev]);
      setContent("");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  if (!book) return null;

  return (
    <main className="flex min-h-svh flex-col px-4 pb-24 pt-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* 뒤로 */}
        <button onClick={() => router.back()} className="text-sm text-gray-400">
          ← 뒤로
        </button>

        {/* 책 정보 */}
        <div className="flex gap-4">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="h-24 w-16 shrink-0 rounded-lg object-cover shadow"
            />
          ) : (
            <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
              📚
            </div>
          )}
          <div className="min-w-0 pt-1">
            <h1 className="text-lg font-bold leading-snug">{book.title}</h1>
            <p className="mt-1 text-sm text-gray-400">{book.author}</p>
          </div>
        </div>

        {/* 독후감 작성 */}
        {memberId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 책을 읽고 어떤 생각이 들었나요?"
              rows={4}
              className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting ? "등록 중..." : "독후감 남기기"}
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-gray-400">
            그룹에 참여해야 독후감을 남길 수 있어요.
          </p>
        )}

        {/* 독후감 목록 */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            독후감 {reviews.length}개
          </h2>

          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 독후감이 없어요. 첫 번째로 남겨보세요!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-gray-50 px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {review.members?.nickname ?? "알 수 없음"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
