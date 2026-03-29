"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

function generateToken() {
  return crypto.randomUUID();
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!code) {
      setChecking(false);
      return;
    }

    async function checkCode() {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", code.toUpperCase())
        .single();

      if (error || !data) {
        setError("유효하지 않은 초대코드예요.");
      } else {
        setGroupId(data.id);
        setGroupName(data.name);
      }
      setChecking(false);
    }

    checkCode();
  }, [code]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !groupId) return;

    setLoading(true);
    setError("");

    // 동일 닉네임 멤버가 이미 있으면 기존 정보 사용
    const { data: existing } = await supabase
      .from("members")
      .select("id, session_token")
      .eq("group_id", groupId)
      .eq("nickname", nickname.trim())
      .single();

    if (existing) {
      localStorage.setItem("session_token", existing.session_token);
      localStorage.setItem("group_id", groupId);
      router.push(`/group/${groupId}`);
      return;
    }

    const sessionToken = generateToken();

    const { error: memberError } = await supabase.from("members").insert({
      group_id: groupId,
      nickname: nickname.trim(),
      session_token: sessionToken,
    });

    if (memberError) {
      setError("참여에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    localStorage.setItem("session_token", sessionToken);
    localStorage.setItem("group_id", groupId);
    router.push(`/group/${groupId}`);
  }

  if (checking) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">확인 중...</p>
      </main>
    );
  }

  if (!code || (error && !groupId)) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-4xl">😅</p>
          <p className="font-semibold">
            {!code ? "초대코드가 없어요." : error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white"
          >
            홈으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400">
            ← 뒤로
          </button>
          <h1 className="mt-4 text-2xl font-bold">그룹 참여하기</h1>
        </div>

        <div className="rounded-2xl bg-gray-50 px-4 py-4">
          <p className="text-xs text-gray-400">참여할 그룹</p>
          <p className="mt-0.5 font-semibold">{groupName}</p>
          <p className="mt-0.5 text-xs tracking-widest text-gray-400">
            {code.toUpperCase()}
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">내 닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 책벌레이영희"
              className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none focus:border-black"
              maxLength={20}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "참여 중..." : "참여하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center">
          <p className="text-sm text-gray-400">확인 중...</p>
        </main>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
