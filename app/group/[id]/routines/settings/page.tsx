"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

const ROUTINES = [
  { type: "diet",           label: "식단",     icon: "🍱" },
  { type: "duolingo",       label: "듀오링고", icon: "🦜" },
  { type: "gym",            label: "운동",     icon: "🏋️" },
  { type: "reading",        label: "독서",     icon: "📚" },
  { type: "running",        label: "런닝",     icon: "🏃" },
  { type: "skin_care",      label: "피부관리", icon: "🧴" },
  { type: "online_lecture", label: "인강 듣기",icon: "🎧" },
  { type: "self_dev",       label: "자기개발", icon: "💡" },
];

const DEFAULT_TARGETS: Record<string, number> = {
  gym: 5, reading: 5, running: 3,
  diet: 7, duolingo: 7,
  skin_care: 0, online_lecture: 0, self_dev: 0,
};

const TARGET_OPTIONS = [
  { value: 0, label: "선택" },
  { value: 1, label: "주 1일" },
  { value: 2, label: "주 2일" },
  { value: 3, label: "주 3일" },
  { value: 4, label: "주 4일" },
  { value: 5, label: "주 5일" },
  { value: 6, label: "주 6일" },
  { value: 7, label: "매일" },
];

export default function RoutineSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [memberId, setMemberId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem("session_token");
      if (!token) { setLoading(false); return; }

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("session_token", token)
        .eq("group_id", groupId)
        .single();

      if (!member) { setLoading(false); return; }
      setMemberId(member.id);

      const { data: reqs } = await supabase
        .from("member_routine_requirements")
        .select("routine_type, weekly_target")
        .eq("member_id", member.id);

      if (reqs && reqs.length > 0) {
        const map = { ...DEFAULT_TARGETS };
        reqs.forEach((r) => { map[r.routine_type] = r.weekly_target; });
        setTargets(map);
      }

      setLoading(false);
    }
    init();
  }, [groupId]);

  async function handleSave() {
    if (!memberId) return;
    setSaving(true);

    const rows = Object.entries(targets).map(([routine_type, weekly_target]) => ({
      member_id: memberId,
      group_id: groupId,
      routine_type,
      weekly_target,
    }));

    await supabase
      .from("member_routine_requirements")
      .upsert(rows, { onConflict: "member_id,routine_type" });

    router.replace(`/group/${groupId}/routines`);
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
      <Header title="루틴 목표 설정" backHref={`/group/${groupId}/routines`} />
      <main className="flex flex-col px-4 pt-4 pb-24">
        <div className="mx-auto w-full max-w-md space-y-3">
          <p className="text-xs text-gray-400">나만의 루틴 목표를 설정해요</p>

          {ROUTINES.map(({ type, label, icon }) => (
            <div key={type} className="rounded-2xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TARGET_OPTIONS.map(({ value, label: optLabel }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setTargets((prev) => ({ ...prev, [type]: value }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      targets[type] === value
                        ? "bg-black text-white"
                        : "border border-gray-200 text-gray-600"
                    }`}
                  >
                    {optLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving || !memberId}
            className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </main>
    </>
  );
}
