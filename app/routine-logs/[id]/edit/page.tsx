"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

const ROUTINE_LABELS: Record<string, string> = {
  gym: "헬스장",
  diet: "식단",
  duolingo: "듀오링고",
  reading: "독서",
  self_dev: "자기개발",
};

interface RoutineLog {
  id: string;
  type: string;
  photo_url: string | null;
  text_content: string | null;
  review_id: string | null;
  group_id: string;
}

export default function EditRoutineLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("routine_logs")
        .select("id, type, photo_url, text_content, review_id, group_id")
        .eq("id", id)
        .single();

      if (!data) {
        router.replace("/");
        return;
      }

      setLog(data);
      setPreview(data.photo_url);
      setText(data.text_content ?? "");

      // reading 타입은 리뷰 수정 페이지로 바로 이동
      if (data.type === "reading" && data.review_id) {
        router.replace(`/reviews/${data.review_id}/edit`);
        return;
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!log) return;
    setSaving(true);

    const sessionToken = localStorage.getItem("session_token");
    const updates: Record<string, string> = {};

    if (log.type === "self_dev") {
      updates.text_content = text.trim();
    } else if (photo) {
      const ext = photo.name.split(".").pop() ?? "jpg";
      const path = `${log.group_id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("routine-photos")
        .upload(path, photo);

      if (uploadError) {
        setSaving(false);
        alert("사진 업로드에 실패했어요.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("routine-photos")
        .getPublicUrl(path);

      updates.photo_url = publicUrl;
    }

    await fetch(`/api/routine-logs/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken ?? "",
      },
      body: JSON.stringify(updates),
    });

    const groupId = localStorage.getItem("group_id");
    router.replace(groupId ? `/group/${groupId}/routines` : "/");
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </main>
    );
  }

  if (!log) return null;

  const isPhotoType = ["gym", "diet", "duolingo"].includes(log.type);
  const label = ROUTINE_LABELS[log.type] ?? log.type;

  return (
    <>
      <Header title={`${label} 수정`} />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-4">
          {isPhotoType ? (
            <>
              <p className="text-sm text-gray-500">새 사진으로 교체할 수 있어요</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="미리보기"
                    className="max-h-96 w-full rounded-2xl object-cover"
                  />
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="absolute bottom-3 right-3 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
                  >
                    다시 찍기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400"
                >
                  <ImagePlus size={28} />
                  <span className="text-sm">사진 선택</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !photo}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">내용을 수정해요</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
              />
              <button
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
