"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";
import { dateToLogDate } from "@/lib/utils";

export default function OnlineLectureRoutinePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(() => new Date());
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const gid = localStorage.getItem("group_id");
      const token = localStorage.getItem("session_token");
      setGroupId(gid);

      if (token && gid) {
        const { data } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", token)
          .eq("group_id", gid)
          .single();
        if (data) setMemberId(data.id);
      }
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !memberId || !groupId) return;
    setSubmitting(true);

    await supabase.from("routine_logs").insert({
      member_id: memberId,
      group_id: groupId,
      type: "online_lecture",
      text_content: text.trim(),
      log_date: dateToLogDate(logDate),
    });

    router.replace(`/group/${groupId}/routines`);
  }

  return (
    <>
      <Header
        title="인강 듣기"
        backHref={groupId ? `/group/${groupId}/routines` : undefined}
      />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-4">
          <p className="text-sm text-gray-500">
            오늘 들은 인강을 기록해요. 자격증, 운전, 어학 등 뭐든 OK!
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <DateTimePicker value={logDate} onChange={setLogDate} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예: 운전면허 학과 3강 / 정보처리기사 1-2강 / JLPT N3 인강 30분"
              rows={5}
              className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting ? "저장 중..." : "오늘의 인강 완료 🎧"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
