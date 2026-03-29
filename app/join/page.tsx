"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

function generateToken() {
  return crypto.randomUUID();
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const redirect = searchParams.get("redirect") ?? "";

  const [manualCode, setManualCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [checking, setChecking] = useState(() => Boolean(code));

  useEffect(() => {
    if (!code) {
      setChecking(false);
      setGroupId("");
      setGroupName("");
      setError("");
      return;
    }

    setChecking(true);
    setError("");
    setGroupId("");
    setGroupName("");

    let cancelled = false;

    async function checkCode() {
      const { data, error: fetchError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", code.toUpperCase())
        .single();

      if (cancelled) return;

      if (fetchError || !data) {
        setError("유효하지 않은 초대코드예요.");
      } else {
        setGroupId(data.id);
        setGroupName(data.name);
      }
      setChecking(false);
    }

    checkCode();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !groupId) return;

    setLoading(true);
    setError("");

    const { data: existing } = await supabase
      .from("members")
      .select("id, session_token")
      .eq("group_id", groupId)
      .eq("nickname", nickname.trim())
      .single();

    if (existing) {
      localStorage.setItem("session_token", existing.session_token);
      localStorage.setItem("group_id", groupId);
      localStorage.setItem("member_id", existing.id);
      router.push(redirect || `/group/${groupId}`);
      return;
    }

    const sessionToken = generateToken();

    const { data: newMember, error: memberError } = await supabase
      .from("members")
      .insert({ group_id: groupId, nickname: nickname.trim(), session_token: sessionToken })
      .select()
      .single();

    if (memberError) {
      setError("참여에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    localStorage.setItem("session_token", sessionToken);
    localStorage.setItem("group_id", groupId);
    localStorage.setItem("member_id", newMember.id);
    router.push(redirect || `/group/${groupId}`);
  }

  function joinQuerySuffix() {
    return redirect
      ? `?redirect=${encodeURIComponent(redirect)}`
      : "";
  }

  function goToJoinWithCode(nextCode: string) {
    const q = new URLSearchParams();
    q.set("code", nextCode);
    if (redirect) q.set("redirect", redirect);
    router.push(`/join?${q.toString()}`);
  }

  if (checking) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-gray-400">확인 중...</p>
      </main>
    );
  }

  if (!code) {
    return (
      <>
        <Header title="그룹 참여하기" />
        <main className="flex flex-col px-6 pb-10 pt-6">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <p className="text-sm text-gray-500">
              다른 그룹에 참여하려면 초대코드를 입력해 주세요.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const c = manualCode.trim().toUpperCase();
                if (!c) return;
                goToJoinWithCode(c);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="invite-code" className="text-sm font-medium">
                  초대코드
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="예: ABC12XYZ"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm tracking-widest outline-none focus:border-black"
                  maxLength={32}
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                다음
              </button>
            </form>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-sm text-gray-400 underline-offset-4 hover:underline"
            >
              홈으로
            </button>
          </div>
        </main>
      </>
    );
  }

  if (error && !groupId) {
    return (
      <>
        <Header title="그룹 참여하기" />
        <main className="flex min-h-svh flex-col items-center justify-center px-6 pb-24">
          <div className="w-full max-w-sm space-y-4 text-center">
            <p className="text-4xl">😅</p>
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => router.push(`/join${joinQuerySuffix()}`)}
              className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white"
            >
              다른 코드로 참여하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-sm text-gray-400 underline-offset-4 hover:underline"
            >
              홈으로
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="그룹 참여하기" />
      <main className="flex flex-col px-6 pb-10 pt-6">
      <div className="mx-auto w-full max-w-sm space-y-6">
        {redirect && (
          <p className="text-xs text-gray-400">참여 후 공유된 페이지로 이동해요</p>
        )}

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
    </>
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
