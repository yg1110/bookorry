"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

export default function DuolingoRoutinePage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!photo || !memberId || !groupId) return;
    setUploading(true);

    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `${groupId}/${memberId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("routine-photos")
      .upload(path, photo);

    if (uploadError) {
      setUploading(false);
      alert("사진 업로드에 실패했어요. 다시 시도해주세요.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("routine-photos").getPublicUrl(path);

    await supabase.from("routine_logs").insert({
      member_id: memberId,
      group_id: groupId,
      type: "duolingo",
      photo_url: publicUrl,
      log_date: new Date().toISOString().split("T")[0],
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

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
                다시 선택
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
            disabled={!photo || uploading}
            className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {uploading ? "업로드 중..." : "오늘의 듀오링고 완료 🦜"}
          </button>
        </div>
      </main>
    </>
  );
}
