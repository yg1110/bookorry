"use client";

import Script from "next/script";

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
  path: string;
}

export function KakaoShareButton({ title, description, imageUrl, path }: KakaoShareButtonProps) {
  function handleShare() {
    const kakao = window.Kakao;
    if (!kakao) return;

    if (!kakao.isInitialized()) {
      kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
    }

    const url = `${window.location.origin}${path}`;

    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "독후감 보기",
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
        strategy="lazyOnload"
      />
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
