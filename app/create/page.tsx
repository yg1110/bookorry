"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BOOK-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateToken() {
  return crypto.randomUUID();
}

export default function CreatePage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupId, setGroupId] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !nickname.trim()) return;

    setLoading(true);
    setError("");

    const code = generateInviteCode();
    const sessionToken = generateToken();

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name: groupName.trim(), invite_code: code })
      .select()
      .single();

    if (groupError) {
      setError("그룹 생성에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("members").insert({
      group_id: group.id,
      nickname: nickname.trim(),
      session_token: sessionToken,
    });

    if (memberError) {
      setError("멤버 등록에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    localStorage.setItem("session_token", sessionToken);
    localStorage.setItem("group_id", group.id);
    setInviteCode(code);
    setGroupId(group.id);
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inviteCode) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <div className="text-4xl">🎉</div>
            <h1 className="mt-3 text-xl font-bold">그룹이 만들어졌어요!</h1>
            <p className="mt-1 text-sm text-gray-500">
              초대코드를 친구들에게 공유해보세요
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-6 py-5">
            <p className="text-xs text-gray-400">초대코드</p>
            <p className="mt-1 text-2xl font-bold tracking-widest">{inviteCode}</p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white"
          >
            {copied ? "복사됐어요 ✓" : "초대코드 복사"}
          </button>

          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className="w-full text-sm text-gray-400 underline"
          >
            그룹 홈으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col px-6 py-12">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400">
            ← 뒤로
          </button>
          <h1 className="mt-4 text-2xl font-bold">그룹 만들기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">그룹 이름</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="예: 독서모임 A팀"
              className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none focus:border-black"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">내 닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 책벌레김철수"
              className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm outline-none focus:border-black"
              maxLength={20}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !groupName.trim() || !nickname.trim()}
            className="w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "생성 중..." : "그룹 만들기"}
          </button>
        </form>
      </div>
    </main>
  );
}
