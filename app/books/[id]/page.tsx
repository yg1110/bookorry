"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { KakaoShareButton } from "@/components/kakao-share-button";
import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
  group_id: string;
  groups: { invite_code: string } | null;
}

interface Review {
  id: string;
  content: string;
  reviewed_at: string;
  members: { id: string; nickname: string } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [reviewedAt, setReviewedAt] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const sessionToken = localStorage.getItem("session_token");

      const [bookRes, reviewsRes] = await Promise.all([
        supabase
          .from("books")
          .select("id, title, author, thumbnail, group_id, groups(invite_code)")
          .eq("id", id)
          .single(),
        supabase
          .from("reviews")
          .select("id, content, reviewed_at, members(id, nickname)")
          .eq("book_id", id)
          .order("reviewed_at", { ascending: false }),
      ]);

      if (bookRes.error || !bookRes.data) {
        router.replace("/");
        return;
      }

      const bookData = bookRes.data as Book;
      setBook(bookData);
      setReviews((reviewsRes.data as Review[]) ?? []);

      if (sessionToken) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", sessionToken)
          .eq("group_id", bookData.group_id)
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
      .insert({
        book_id: book.id,
        member_id: memberId,
        content: content.trim(),
        reviewed_at: reviewedAt.toISOString(),
      })
      .select("id, content, reviewed_at, members(id, nickname)")
      .single();

    if (!error && data) {
      setReviews((prev) => [data as Review, ...prev]);
      setContent("");
      setReviewedAt(new Date());
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

  const inviteCode = book.groups?.invite_code;
  const joinUrl = inviteCode
    ? `/join?code=${inviteCode}&redirect=/books/${book.id}`
    : "/";

  return (
    <>
      <Header title={book.title} />
      <main className="flex flex-col px-4 pb-24 pt-6">
      <div className="mx-auto w-full max-w-md space-y-6">

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

        {/* 카카오 공유 */}
        <KakaoShareButton
          title={book.title}
          description={`${book.author} · 독후감 ${reviews.length}개`}
          imageUrl={book.thumbnail}
          path={`/books/${book.id}`}
        />

        {/* 독후감 작성 or 참여 CTA */}
        {memberId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <DateTimePicker value={reviewedAt} onChange={setReviewedAt} />
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
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">독후감을 남기려면 그룹에 참여하세요</p>
            <Link
              href={joinUrl}
              className="mt-3 inline-block rounded-2xl bg-black px-6 py-2.5 text-sm font-semibold text-white"
            >
              그룹 참여하기
            </Link>
          </div>
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
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="block rounded-2xl bg-gray-50 px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  {review.members ? (
                    <button
                      className="text-xs font-semibold underline decoration-dotted"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/members/${review.members!.id}`);
                      }}
                    >
                      {review.members.nickname}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400">알 수 없음</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDate(review.reviewed_at)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
    </>
  );
}
