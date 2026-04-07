"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, X } from "lucide-react";
import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";
import { dateToLogDate } from "@/lib/utils";

export default function DuolingoRoutinePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(() => new Date());
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setPhotos((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (photos.length === 0 || !memberId || !groupId) return;
    setUploading(true);

    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop() ?? "jpg";
      const path = `${groupId}/${memberId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("routine-photos")
        .upload(path, photo);

      if (uploadError) {
        setUploading(false);
        alert("사진 업로드에 실패했어요. 다시 시도해주세요.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("routine-photos")
        .getPublicUrl(path);
      urls.push(publicUrl);
    }

    await supabase.from("routine_logs").insert({
      member_id: memberId,
      group_id: groupId,
      type: "duolingo",
      photo_url: urls[0],
      photo_urls: urls,
      log_date: dateToLogDate(logDate),
    });

    router.replace(`/group/${groupId}/routines`);
  }

  return (
    <>
      <Header
        title="듀오링고"
        backHref={groupId ? `/group/${groupId}/routines` : undefined}
      />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-4">
          <p className="text-sm text-gray-500">
            오늘의 듀오링고 스트릭 화면을 캡처해서 올려요
          </p>

          <DateTimePicker value={logDate} onChange={setLogDate} />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          {previews.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover"
                  />
                  <button
                    onClick={() => removePhoto(i)}
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
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 active:bg-gray-50"
            >
              <ImagePlus size={28} />
              <span className="text-sm">스크린샷 올리기</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={photos.length === 0 || uploading}
            className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {uploading ? "업로드 중..." : "오늘의 듀오링고 완료 🦜"}
          </button>
        </div>
      </main>
    </>
  );
}
