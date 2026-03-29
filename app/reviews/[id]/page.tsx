"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";
import { relationOne } from "@/lib/supabase-relations";

interface Review {
  id: string;
  content: string;
  reviewed_at: string;
  members: { id: string; nickname: string; group_id: string } | null;
  books: {
    id: string;
    title: string;
    author: string;
    thumbnail: string | null;
    group_id: string;
    groups: { invite_code: string } | null;
  } | null;
}

interface ReviewComment {
  id: string;
  content: string;
  created_at: string;
  members: { id: string; nickname: string } | null;
}

type ReviewBookRow = Omit<NonNullable<Review["books"]>, "groups"> & {
  groups: NonNullable<Review["books"]>["groups"] | { invite_code: string }[];
};

type ReviewRow = Omit<Review, "members" | "books"> & {
  members: Review["members"] | NonNullable<Review["members"]>[];
  books: ReviewBookRow | ReviewBookRow[] | null;
};

type ReviewCommentRow = Omit<ReviewComment, "members"> & {
  members: ReviewComment["members"] | NonNullable<ReviewComment["members"]>[];
};

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [review, setReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async (reviewId: string) => {
    const { data } = await supabase
      .from("review_comments")
      .select("id, content, created_at, members(id, nickname)")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });
    const raw = (data as ReviewCommentRow[] | null) ?? [];
    setComments(
      raw.map((row) => ({
        ...row,
        members: relationOne(row.members),
      })),
    );
  }, []);

  useEffect(() => {
    async function load() {
      const sessionToken = localStorage.getItem("session_token");

      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, content, reviewed_at, members(id, nickname, group_id), books(id, title, author, thumbnail, group_id, groups(invite_code))",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/");
        return;
      }

      const row = data as ReviewRow;
      const bookRow = relationOne(row.books);
      const reviewData: Review = {
        ...row,
        members: relationOne(row.members),
        books: bookRow
          ? { ...bookRow, groups: relationOne(bookRow.groups) }
          : null,
      };
      setReview(reviewData);

      const groupId = reviewData.books?.group_id;
      if (sessionToken && groupId) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", sessionToken)
          .eq("group_id", groupId)
          .single();
        if (member) setMemberId(member.id);
      }

      await loadComments(reviewData.id);
      setLoading(false);
    }

    load();
  }, [id, router, loadComments]);

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !memberId || !review) return;

    setCommentSubmitting(true);

    const { data, error } = await supabase
      .from("review_comments")
      .insert({
        review_id: review.id,
        member_id: memberId,
        content: commentText.trim(),
      })
      .select("id, content, created_at, members(id, nickname)")
      .single();

    if (!error && data) {
      const row = data as ReviewCommentRow;
      const added: ReviewComment = {
        ...row,
        members: relationOne(row.members),
      };
      setComments((prev) => [...prev, added]);
      setCommentText("");
    }

    setCommentSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  if (!review) return null;

  const inviteCode = review.books?.groups?.invite_code;
  const joinUrl = inviteCode
    ? `/join?code=${inviteCode}&redirect=/reviews/${review.id}`
    : "/";

  return (
    <>
      <Header title="독후감" />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-6">
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
                <p className="line-clamp-1 text-sm font-semibold">
                  {review.books.title}
                </p>
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
              <span className="text-sm font-semibold text-gray-400">
                알 수 없음
              </span>
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {review.content}
          </p>

          {/* 댓글 */}
          <section className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              댓글 {comments.length}개
            </h2>

            {memberId ? (
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentText.trim()}
                  className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {commentSubmitting ? "등록 중..." : "댓글 남기기"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-center">
                <p className="text-sm text-gray-500">
                  댓글을 남기려면 같은 그룹에 참여해 주세요
                </p>
                <Link
                  href={joinUrl}
                  className="mt-3 inline-block rounded-2xl bg-black px-6 py-2.5 text-sm font-semibold text-white"
                >
                  그룹 참여하기
                </Link>
              </div>
            )}

            {comments.length > 0 ? (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      {c.members ? (
                        <Link
                          href={`/members/${c.members.id}`}
                          className="text-xs font-semibold underline decoration-dotted"
                        >
                          {c.members.nickname}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">
                          알 수 없음
                        </span>
                      )}
                      <time className="shrink-0 text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-center text-sm text-gray-400">
                아직 댓글이 없어요
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
