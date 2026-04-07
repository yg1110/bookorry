"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2 } from "lucide-react";

import { Header } from "@/components/header";
import { ImageLightbox } from "@/components/image-lightbox";
import { KakaoShareButton } from "@/components/kakao-share-button";
import { supabase } from "@/lib/supabase";
import { relationOne } from "@/lib/supabase-relations";
import { todayKST } from "@/lib/utils";

const ROUTINE_LABELS: Record<string, { label: string; icon: string }> = {
  gym: { label: "헬스장", icon: "🏋️" },
  diet: { label: "식단", icon: "🍱" },
  duolingo: { label: "듀오링고", icon: "🦜" },
  reading: { label: "독서", icon: "📚" },
  self_dev: { label: "자기개발", icon: "💡" },
};

const REQUIRED_TYPES = ["gym", "diet", "duolingo", "reading"] as const;

interface Member {
  id: string;
  nickname: string;
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
}

interface FeedItem {
  id: string;
  type: string;
  photo_url: string | null;
  photo_urls: string[];
  text_content: string | null;
  created_at: string;
  members: { id: string; nickname: string } | null;
  reviews: {
    id: string;
    content: string;
    books: { id: string; title: string; thumbnail: string | null } | null;
  } | null;
}

interface StandaloneReview {
  id: string;
  content: string;
  created_at: string;
  members:
    | { id: string; nickname: string }
    | NonNullable<{ id: string; nickname: string }>[]
    | null;
  books:
    | { id: string; title: string; thumbnail: string | null }
    | NonNullable<{ id: string; title: string; thumbnail: string | null }>[]
    | null;
}

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [todayDone, setTodayDone] = useState<
    { type: string; member_id: string }[]
  >([]);
  const [lightbox, setLightbox] = useState<{ srcs: string[]; index: number } | null>(null);

  useEffect(() => {
    async function load() {
      const today = todayKST();
      const [groupRes, membersRes, logsRes, reviewsRes, todayRes] =
        await Promise.all([
          supabase
            .from("groups")
            .select("id, name, invite_code")
            .eq("id", id)
            .single(),
          supabase
            .from("members")
            .select("id, nickname")
            .eq("group_id", id)
            .order("created_at", { ascending: true }),
          supabase
            .from("routine_logs")
            .select(
              "id, type, photo_url, photo_urls, text_content, created_at, members(id, nickname), reviews(id, content, books(id, title, thumbnail))",
            )
            .eq("group_id", id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("reviews")
            .select(
              "id, content, created_at, members(id, nickname), books(id, title, thumbnail)",
            )
            .eq("books.group_id", id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("routine_logs")
            .select("type, member_id")
            .eq("group_id", id)
            .eq("log_date", today),
        ]);

      if (groupRes.error || !groupRes.data) {
        router.replace("/");
        return;
      }

      setGroup(groupRes.data);
      setMembers(membersRes.data ?? []);

      const sessionToken = localStorage.getItem("session_token");
      if (sessionToken) {
        const { data: me } = await supabase
          .from("members")
          .select("id")
          .eq("session_token", sessionToken)
          .eq("group_id", id)
          .single();
        if (me) setMyMemberId(me.id);
      }

      type RawFeed = Omit<FeedItem, "members" | "reviews"> & {
        members: FeedItem["members"] | NonNullable<FeedItem["members"]>[];
        reviews:
          | (Omit<NonNullable<FeedItem["reviews"]>, "books"> & {
              books:
                | NonNullable<FeedItem["reviews"]>["books"]
                | NonNullable<NonNullable<FeedItem["reviews"]>["books"]>[];
            })
          | NonNullable<FeedItem["reviews"]>[]
          | null;
      };
      const rawLogs = (logsRes.data as RawFeed[] | null) ?? [];
      const routineLogs: FeedItem[] = rawLogs.map((row) => {
        const review = relationOne(row.reviews);
        return {
          ...row,
          photo_urls: row.photo_urls ?? [],
          members: relationOne(row.members),
          reviews: review
            ? { ...review, books: relationOne(review.books) }
            : null,
        };
      });

      // 루틴 로그에 이미 연결된 리뷰 ID 수집 (중복 방지)
      const linkedReviewIds = new Set(
        routineLogs.filter((l) => l.reviews?.id).map((l) => l.reviews!.id),
      );

      // 루틴 로그에 없는 독립 리뷰만 추가
      const rawReviews = (reviewsRes.data as StandaloneReview[] | null) ?? [];
      const standaloneItems: FeedItem[] = rawReviews
        .filter((r) => r.books !== null && !linkedReviewIds.has(r.id))
        .map((r) => ({
          id: `review-${r.id}`,
          type: "reading",
          photo_url: null,
          photo_urls: [],
          text_content: null,
          created_at: r.created_at,
          members: relationOne(r.members),
          reviews: {
            id: r.id,
            content: r.content,
            books: relationOne(r.books),
          },
        }));

      const merged = [...routineLogs, ...standaloneItems].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setFeed(merged);
      setTodayDone(todayRes.data ?? []);
      setLoading(false);
    }

    load();
  }, [id, router]);

  function sendNudge(
    nickname: string,
    missingLabels: string[],
    doneLabels: string[],
  ) {
    const kakao = window.Kakao;
    if (!kakao) return;
    if (!kakao.isInitialized())
      kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
    const origin = window.location.origin;
    const path = `/group/${id}/routines`;
    const url = group?.invite_code
      ? `${origin}/join?code=${group.invite_code}&redirect=${encodeURIComponent(path)}`
      : `${origin}${path}`;
    const nudgeImageUrl =
      `${origin}/api/og/nudge` +
      `?nickname=${encodeURIComponent(nickname)}` +
      `&missing=${encodeURIComponent(missingLabels.join(","))}` +
      `&done=${encodeURIComponent(doneLabels.join(","))}`;
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `${nickname}님, 오늘 루틴 아직이에요`,
        description: `미완료: ${missingLabels.join(", ")}`,
        imageUrl: nudgeImageUrl,
        imageWidth: 1200,
        imageHeight: 630,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: "루틴 하러 가기", link: { mobileWebUrl: url, webUrl: url } },
      ],
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  }

  async function handleDeleteItem(itemId: string, isReview: boolean) {
    if (!confirm("삭제할까요?")) return;
    const sessionToken = localStorage.getItem("session_token");
    const url = isReview
      ? `/api/reviews/${itemId}`
      : `/api/routine-logs/${itemId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "x-session-token": sessionToken ?? "" },
    });
    if (res.ok) {
      setFeed((prev) =>
        prev.filter((f) =>
          isReview ? f.reviews?.id !== itemId : f.id !== itemId,
        ),
      );
    }
  }

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
    <>
      {lightbox && (
        <ImageLightbox
          srcs={lightbox.srcs}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onChangeIndex={(i) => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
        />
      )}
      <Header
        title={group.name}
        back={false}
        right={
          <button
            onClick={handleCopy}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
            title="초대코드 복사"
          >
            {copied ? (
              <span className="text-xs text-green-600">✓</span>
            ) : (
              <Copy size={18} />
            )}
          </button>
        }
      />
      <main className="flex flex-col px-4 pt-4 pb-24">
        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = filterMemberId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setFilterMemberId(active ? null : m.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  {m.nickname}
                </button>
              );
            })}
          </div>

          {/* 오늘 미완료 루틴 현황 */}
          {(() => {
            const incomplete = members
              .map((m) => {
                const done = new Set(
                  todayDone
                    .filter((l) => l.member_id === m.id)
                    .map((l) => l.type),
                );
                const missing = REQUIRED_TYPES.filter((t) => !done.has(t));
                return { ...m, missing };
              })
              .filter((m) => m.missing.length > 0);

            if (incomplete.length === 0) return null;

            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400">
                  오늘 미완료 루틴
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {incomplete.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-3"
                    >
                      <p className="text-xs font-semibold">{m.nickname}</p>
                      <div className="flex flex-wrap gap-1">
                        {m.missing.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                          >
                            {ROUTINE_LABELS[t]?.icon} {ROUTINE_LABELS[t]?.label}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          sendNudge(
                            m.nickname,
                            m.missing.map((t) => ROUTINE_LABELS[t]?.label ?? t),
                            REQUIRED_TYPES.filter(
                              (t) => !m.missing.includes(t),
                            ).map((t) => ROUTINE_LABELS[t]?.label ?? t),
                          )
                        }
                        className="mt-auto w-full rounded-xl bg-[#FEE500] py-1.5 text-[11px] font-semibold text-[#3C1E1E]"
                      >
                        카톡으로 재촉 👉
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {(() => {
            const filtered = filterMemberId
              ? feed.filter((item) => item.members?.id === filterMemberId)
              : feed;

            if (filtered.length === 0) {
              return (
                <div className="py-16 text-center">
                  <p className="text-sm text-gray-400">
                    아직 완료한 루틴이 없어요
                  </p>
                  {!filterMemberId && (
                    <p className="mt-1 text-xs text-gray-300">
                      루틴 탭에서 오늘의 할 일을 완료해보세요
                    </p>
                  )}
                </div>
              );
            }

            return (
              <section className="space-y-3">
                {filtered.map((item) => {
                  const routine = ROUTINE_LABELS[item.type] ?? {
                    label: item.type,
                    icon: "✅",
                  };

                  const isOwn = item.members?.id === myMemberId;
                  const dateStr = formatDate(item.created_at);
                  // photo_urls 우선, 없으면 photo_url 하나짜리 배열로 폴백
                  const photos =
                    item.photo_urls.length > 0
                      ? item.photo_urls
                      : item.photo_url
                        ? [item.photo_url]
                        : [];

                  if (item.type === "reading" && item.reviews) {
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-gray-50 px-4 py-4"
                      >
                        <Link
                          href={`/reviews/${item.reviews.id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-2">
                            {item.reviews.books?.thumbnail ? (
                              <img
                                src={item.reviews.books.thumbnail}
                                alt={item.reviews.books.title}
                                className="h-8 w-6 rounded object-cover"
                              />
                            ) : (
                              <span className="text-base">{routine.icon}</span>
                            )}
                            <span className="line-clamp-1 text-xs text-gray-400">
                              {item.reviews.books?.title}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.reviews.content}
                          </p>
                        </Link>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">
                              {item.members?.nickname}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {dateStr}
                            </span>
                          </div>
                          {isOwn && (
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/reviews/${item.reviews.id}/edit`}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() =>
                                  handleDeleteItem(item.reviews!.id, true)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (photos.length > 0) {
                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl bg-gray-50"
                      >
                        {photos.length === 1 ? (
                          <img
                            src={photos[0]}
                            alt={routine.label}
                            className="w-full cursor-pointer object-cover"
                            style={{ maxHeight: 320 }}
                            onClick={() => setLightbox({ srcs: photos, index: 0 })}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-0.5">
                            {photos.slice(0, 4).map((src, i) => (
                              <div key={i} className="relative">
                                <img
                                  src={src}
                                  alt=""
                                  className="aspect-square w-full cursor-pointer object-cover"
                                  onClick={() => setLightbox({ srcs: photos, index: i })}
                                />
                                {i === 3 && photos.length > 4 && (
                                  <div
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-lg font-semibold text-white"
                                    onClick={() => setLightbox({ srcs: photos, index: 3 })}
                                  >
                                    +{photos.length - 4}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">
                              {item.members?.nickname}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {dateStr}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-400">
                              {routine.icon} {routine.label}
                            </span>
                            {isOwn && (
                              <>
                                <Link
                                  href={`/routine-logs/${item.id}/edit`}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                                >
                                  <Pencil size={14} />
                                </Link>
                                <button
                                  onClick={() =>
                                    handleDeleteItem(item.id, false)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-gray-50 px-4 py-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{routine.icon}</span>
                        <span className="text-xs text-gray-400">
                          {routine.label}
                        </span>
                      </div>
                      {item.text_content && (
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.text_content}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">
                            {item.members?.nickname}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {dateStr}
                          </span>
                        </div>
                        {isOwn && (
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/routine-logs/${item.id}/edit`}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => handleDeleteItem(item.id, false)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 active:bg-gray-200"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })()}
        </div>
      </main>
    </>
  );
}
