"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  nickname: string;
  group_id: string;
}

interface Review {
  id: string;
  content: string;
  reviewed_at: string;
  books: { id: string; title: string; thumbnail: string | null } | null;
}

export default function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id, nickname, group_id")
        .eq("id", id)
        .single();

      if (memberError || !memberData) {
        router.replace("/");
        return;
      }

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, content, reviewed_at, books(id, title, thumbnail)")
        .eq("member_id", id)
        .order("reviewed_at", { ascending: false });

      setMember(memberData);
      setReviews((reviewsData as Review[]) ?? []);
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

  if (!member) return null;

  return (
    <main className="flex min-h-svh flex-col px-4 pb-24 pt-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400">
          ← 뒤로
        </button>

        {/* 프로필 */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
            📖
          </div>
          <div>
            <h1 className="text-xl font-bold">{member.nickname}</h1>
            <p className="text-xs text-gray-400">독후감 {reviews.length}편</p>
          </div>
        </div>

        {/* 독후감 목록 */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            작성한 독후감
          </h2>

          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 작성한 독후감이 없어요
            </p>
          ) : (
            reviews.map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="block rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-center gap-2">
                  {review.books?.thumbnail && (
                    <img
                      src={review.books.thumbnail}
                      alt={review.books.title}
                      className="h-8 w-6 rounded object-cover"
                    />
                  )}
                  <span className="line-clamp-1 text-xs text-gray-400">
                    {review.books?.title}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed">
                  {review.content}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(review.reviewed_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
