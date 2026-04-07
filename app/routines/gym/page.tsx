"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Images, Plus, X } from "lucide-react";
import { Header } from "@/components/header";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabase";
import { dateToLogDate } from "@/lib/utils";

export default function GymRoutinePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(() => new Date());
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      type: "gym",
      photo_url: urls[0],
      photo_urls: urls,
      log_date: dateToLogDate(logDate),
    });

    router.replace(`/group/${groupId}/routines`);
  }

  return (
    <>
      <Header
        title="헬스장"
        backHref={groupId ? `/group/${groupId}/routines` : undefined}
      />
      <main className="flex flex-col px-4 pt-6 pb-24">
        <div className="mx-auto w-full max-w-md space-y-4">
          <p className="text-sm text-gray-500">입구 사진을 찍어 오늘의 운동을 인증해요</p>

          <DateTimePicker value={logDate} onChange={setLogDate} />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <input
            ref={galleryInputRef}
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
                onClick={() => galleryInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 active:bg-gray-50"
              >
                <Plus size={24} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 active:bg-gray-50"
              >
                <Camera size={28} />
                <span className="text-sm">사진 찍기</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 active:bg-gray-50"
              >
                <Images size={28} />
                <span className="text-sm">사진 목록에서 선택</span>
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={photos.length === 0 || uploading}
            className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {uploading ? "업로드 중..." : "오늘의 운동 완료 🏋️"}
          </button>
        </div>
      </main>
    </>
  );
}
