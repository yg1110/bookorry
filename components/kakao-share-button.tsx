"use client";

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: object) => void;
      };
    };
  }
}

interface KakaoShareButtonProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  /** 공유 후 열 경로 (예: /books/uuid, /group/uuid) */
  path: string;
  /** 있으면 링크가 초대(참여) 후 redirect 로 이어지도록 /join?code=…&redirect=… 형태가 됨 */
  inviteCode?: string | null;
}

function buildShareUrl(origin: string, path: string, inviteCode?: string | null) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (inviteCode) {
    const q = new URLSearchParams();
    q.set("code", inviteCode);
    q.set("redirect", p);
    return `${origin}/join?${q.toString()}`;
  }
  return `${origin}${p}`;
}

export function KakaoShareButton({
  title,
  description,
  imageUrl,
  path,
  inviteCode,
}: KakaoShareButtonProps) {
  function handleShare() {
    const kakao = window.Kakao;
    if (!kakao) return;

    if (!kakao.isInitialized()) {
      kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
    }

    const origin = window.location.origin;
    const url = buildShareUrl(origin, path, inviteCode);
    const buttonTitle = inviteCode ? "참여하고 보기" : "열기";

    const ogUrl = `${origin}/api/og?group=${encodeURIComponent(title)}`;

    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: imageUrl ?? ogUrl,
        imageWidth: 1200,
        imageHeight: 630,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: buttonTitle,
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3 text-sm font-semibold text-[#3C1E1E]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.1 1.26 3.95 3.18 5.04l-.8 2.96 3.43-2.26c.54.08 1.1.12 1.69.12 4.14 0 7.5-2.69 7.5-6s-3.36-6-7.5-6z"
            fill="#3C1E1E"
          />
        </svg>
        카카오로 공유
      </button>
    </>
  );

}
