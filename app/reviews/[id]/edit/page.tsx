"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";

export default function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [content, setContent] = useState("");
  const [reviewedAt, setReviewedAt] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("id, content, reviewed_at, member_id, books(group_id)")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/");
        return;
      }

      const bookGroup = Array.isArray(data.books) ? data.books[0] : data.books;
      const gid = bookGroup?.group_id ?? null;

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("session_token", sessionToken)
        .eq("group_id", gid)
        .single();

      if (!member || member.id !== data.member_id) {
        router.replace(`/reviews/${id}`);
        return;
      }

      setContent(data.content);
      setReviewedAt(new Date(data.reviewed_at));
      setGroupId(gid);
      setLoading(false);
    }

    load();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);

    const sessionToken = localStorage.getItem("session_token") ?? "";
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken,
      },
      body: JSON.stringify({ content: content.trim(), reviewed_at: reviewedAt.toISOString() }),
    });

    setSubmitting(false);

    if (res.ok) {
      router.replace(`/reviews/${id}`);
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  return (
    <>
      <Header title="독후감 수정" backHref={`/reviews/${id}`} />
      <main className="flex flex-col px-4 pb-24 pt-6">
        <div className="mx-auto w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">읽은 날짜</label>
              <DateTimePicker value={reviewedAt} onChange={setReviewedAt} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">독후감</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                maxLength={5000}
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
