"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";
import { dateToLogDate } from "@/lib/utils";

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
  photo_urls: string[];
  text_content: string | null;
  review_id: string | null;
  group_id: string;
  log_date: string;
}

export default function EditRoutineLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [logDate, setLogDate] = useState(() => new Date());
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("routine_logs")
        .select("id, type, photo_url, photo_urls, text_content, review_id, group_id, log_date")
        .eq("id", id)
        .single();

      if (!data) {
        router.replace("/");
        return;
      }

      setLog(data);

      // log_date(YYYY-MM-DD) → Date (KST 자정)
      if (data.log_date) {
        const [y, m, d] = data.log_date.split("-").map(Number);
        setLogDate(new Date(y, m - 1, d));
      }

      const urls: string[] =
        data.photo_urls?.length > 0
          ? data.photo_urls
          : data.photo_url
            ? [data.photo_url]
            : [];
      setExistingUrls(urls);
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

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files);
    setNewFiles((prev) => [...prev, ...added]);
    setNewPreviews((prev) => [
      ...prev,
      ...added.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removeExisting(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!log) return;
    setSaving(true);

    const sessionToken = localStorage.getItem("session_token");
    const updatedLogDate = dateToLogDate(logDate);

    if (log.type === "self_dev") {
      await fetch(`/api/routine-logs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken ?? "",
        },
        body: JSON.stringify({ text_content: text.trim(), log_date: updatedLogDate }),
      });
    } else {
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${log.group_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("routine-photos")
          .upload(path, file);

        if (uploadError) {
          setSaving(false);
          alert("사진 업로드에 실패했어요.");
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("routine-photos")
          .getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }

      const finalUrls = [...existingUrls, ...uploadedUrls];
      await fetch(`/api/routine-logs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken ?? "",
        },
        body: JSON.stringify({
          photo_url: finalUrls[0] ?? null,
          photo_urls: finalUrls,
          log_date: updatedLogDate,
        }),
      });
    }

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
  const totalPhotos = existingUrls.length + newFiles.length;

  return (
    <>
      <Header title={`${label} 수정`} />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-4">
          <DateTimePicker value={logDate} onChange={setLogDate} />

          {isPhotoType ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />

              <div className="grid grid-cols-3 gap-2">
                {existingUrls.map((src, i) => (
                  <div key={`e-${i}`} className="relative aspect-square">
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <button
                      onClick={() => removeExisting(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={`n-${i}`} className="relative aspect-square">
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <button
                      onClick={() => removeNew(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 active:bg-gray-50"
                >
                  <Plus size={24} />
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || totalPhotos === 0}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
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
