"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

import { Header } from "@/components/header";
import { ImageLightbox } from "@/components/image-lightbox";
import { KakaoShareButton } from "@/components/kakao-share-button";
import { supabase } from "@/lib/supabase";
import { relationOne } from "@/lib/supabase-relations";
import { todayKST } from "@/lib/utils";

type RoutineType =
  | "gym"
  | "diet"
  | "duolingo"
  | "reading"
  | "self_dev"
  | "skin_care"
  | "online_lecture";

interface RoutineLog {
  id: string;
  type: RoutineType;
  photo_url: string | null;
  photo_urls: string[];
  text_content: string | null;
  member_id: string;
  created_at: string;
  members: { nickname: string } | null;
  reviews: { books: { thumbnail: string | null } | null } | null;
}

const ROUTINES = [
  {
    type: "gym" as const,
    label: "운동",
    icon: "🏋️",
    desc: "입구 사진 찍기",
    href: "/routines/gym",
  },
  {
    type: "diet" as const,
    label: "식단",
    icon: "🍱",
    desc: "식단 사진 올리기",
    href: "/routines/diet",
  },
  {
    type: "duolingo" as const,
    label: "듀오링고",
    icon: "🦜",
    desc: "스트릭 인증하기",
    href: "/routines/duolingo",
  },
  {
    type: "reading" as const,
    label: "독서",
    icon: "📚",
    desc: "5분 읽고 독후감 쓰기",
    href: "/routines/reading",
  },
  {
    type: "skin_care" as const,
    label: "피부관리",
    icon: "🧴",
    desc: "스킨케어 루틴 인증하기",
    href: "/routines/skin-care",
  },
  {
    type: "online_lecture" as const,
    label: "인강 듣기",
    icon: "🎧",
    desc: "자격증, 운전, 어학 등 인강 인증",
    href: "/routines/online-lecture",
  },
  {
    type: "self_dev" as const,
    label: "자기개발",
    icon: "💡",
    desc: "오늘 배운 것 공유하기",
    href: "/routines/self-dev",
    optional: true,
  },
] as const;

// ── RoutineCard ────────────────────────────────────────────────────────────────

interface RoutineCardProps {
  routine: (typeof ROUTINES)[number];
  completions: RoutineLog[];
  memberId: string | null;
}

function RoutineCard({ routine, completions, memberId }: RoutineCardProps) {
  const myDone = completions.some((l) => l.member_id === memberId);
  const myLog = completions.find((l) => l.member_id === memberId);

  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{routine.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{routine.label}</span>
              {"optional" in routine && routine.optional && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                  선택
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{routine.desc}</p>
          </div>
        </div>

        {myDone ? (
          <Link
            href={`/routine-logs/${myLog?.id}/edit`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
          >
            <CheckCircle2 size={12} />
            완료
          </Link>
        ) : (
          <Link
            href={routine.href}
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 active:bg-gray-50"
          >
            완료하기
          </Link>
        )}
      </div>

      {completions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {completions.map((log) => (
            <span
              key={log.id}
              className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
            >
              {log.members?.nickname}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LogItem ────────────────────────────────────────────────────────────────────

interface LogItemProps {
  log: RoutineLog;
  memberId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLightbox: (srcs: string[], index: number) => void;
}

function LogItem({
  log,
  memberId,
  onEdit,
  onDelete,
  onOpenLightbox,
}: LogItemProps) {
  const routine = ROUTINES.find((r) => r.type === log.type);
  const isOwn = log.member_id === memberId;
  const photos =
    log.photo_urls.length > 0
      ? log.photo_urls
      : log.photo_url
        ? [log.photo_url]
        : [];
  const thumbSrc = photos[0] ?? log.reviews?.books?.thumbnail ?? null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
      {thumbSrc ? (
        <div className="relative shrink-0">
          <img
            src={thumbSrc}
            alt=""
            className="h-12 w-12 cursor-pointer rounded-xl object-cover"
            onClick={() =>
              photos.length > 0 ? onOpenLightbox(photos, 0) : undefined
            }
          />
          {photos.length > 1 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
              {photos.length}
            </span>
          )}
        </div>
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center text-2xl">
          {routine?.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{log.members?.nickname}</p>
        <p className="truncate text-xs text-gray-400">
          {routine?.label}
          {log.text_content && ` · ${log.text_content}`}
        </p>
      </div>
      {isOwn && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(log.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(log.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RoutinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [group, setGroup] = useState<{
    name: string;
    invite_code: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{
    srcs: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const sessionToken = localStorage.getItem("session_token");

      const [groupRes] = await Promise.all([
        supabase
          .from("groups")
          .select("name, invite_code")
          .eq("id", groupId)
          .single(),
      ]);
      if (groupRes.data) setGroup(groupRes.data);

      if (sessionToken) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", sessionToken)
          .eq("group_id", groupId)
          .single();
        if (member) setMemberId(member.id);
      }

      const today = todayKST();
      const { data: logsData } = await supabase
        .from("routine_logs")
        .select(
          "id, type, photo_url, photo_urls, text_content, member_id, created_at, members(nickname), reviews(books(thumbnail))",
        )
        .eq("group_id", groupId)
        .eq("log_date", today)
        .order("created_at", { ascending: false });

      type RawLog = Omit<RoutineLog, "members" | "reviews"> & {
        members: RoutineLog["members"] | NonNullable<RoutineLog["members"]>[];
        reviews:
          | RoutineLog["reviews"]
          | NonNullable<RoutineLog["reviews"]>[]
          | null;
      };
      const rawLogs = (logsData as RawLog[] | null) ?? [];
      setLogs(
        rawLogs.map((l) => {
          const review = relationOne(l.reviews);
          return {
            ...l,
            photo_urls: l.photo_urls ?? [],
            members: relationOne(l.members),
            reviews: review
              ? {
                  books: relationOne((review as { books: unknown }).books) as {
                    thumbnail: string | null;
                  } | null,
                }
              : null,
          };
        }),
      );
      setLoading(false);
    }

    load();
  }, [groupId]);

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  async function handleDelete(logId: string) {
    if (!confirm("삭제할까요?")) return;
    const sessionToken = localStorage.getItem("session_token");
    const res = await fetch(`/api/routine-logs/${logId}`, {
      method: "DELETE",
      headers: { "x-session-token": sessionToken ?? "" },
    });
    if (res.ok) setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  const logsByType = logs.reduce<Record<string, RoutineLog[]>>((acc, log) => {
    if (!acc[log.type]) acc[log.type] = [];
    acc[log.type].push(log);
    return acc;
  }, {});

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  return (
    <>
      {lightbox && (
        <ImageLightbox
          srcs={lightbox.srcs}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onChangeIndex={(i) =>
            setLightbox((prev) => (prev ? { ...prev, index: i } : null))
          }
        />
      )}
      <Header title="오늘의 루틴" back={false} />
      <main className="flex flex-col px-4 pt-4 pb-24">
        <div className="mx-auto w-full max-w-md space-y-3">
          <p className="text-xs text-gray-400">{today}</p>

          {ROUTINES.map((routine) => (
            <RoutineCard
              key={routine.type}
              routine={routine}
              completions={logsByType[routine.type] ?? []}
              memberId={memberId}
            />
          ))}

          {group && (
            <KakaoShareButton
              title={group.name}
              description={(() => {
                const myDoneCount = ROUTINES.filter((r) =>
                  (logsByType[r.type] ?? []).some(
                    (l) => l.member_id === memberId,
                  ),
                ).length;
                return myDoneCount > 0
                  ? `오늘 ${myDoneCount}개 루틴 완료! 같이 루틴 챌린지해봐요 💪`
                  : "같이 루틴 챌린지해봐요 💪";
              })()}
              path={`/group/${groupId}/routines`}
              inviteCode={group.invite_code}
            />
          )}

          {logs.length > 0 && (
            <section className="space-y-2 pt-2">
              <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                오늘의 기록
              </h2>
              {logs.map((log) => (
                <LogItem
                  key={log.id}
                  log={log}
                  memberId={memberId}
                  onEdit={(id) => router.push(`/routine-logs/${id}/edit`)}
                  onDelete={handleDelete}
                  onOpenLightbox={(srcs, index) => setLightbox({ srcs, index })}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
