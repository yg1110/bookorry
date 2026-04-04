import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

async function fetchKoreanFont(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&subset=korean",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  ).then((r) => r.text());

  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("font url not found");

  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(req: NextRequest) {
  const group = req.nextUrl.searchParams.get("group") ?? "오늘의 루틴";

  const font = await fetchKoreanFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0a",
          padding: "80px",
          fontFamily: "Noto Sans KR",
        }}
      >
        <div
          style={{
            color: "#555",
            fontSize: "22px",
            marginBottom: "20px",
            letterSpacing: "0.08em",
          }}
        >
          부코리
        </div>

        <div
          style={{
            color: "#ffffff",
            fontSize: group.length > 10 ? "60px" : "72px",
            fontWeight: "700",
            lineHeight: "1.15",
            letterSpacing: "-2px",
            marginBottom: "20px",
            maxWidth: "900px",
          }}
        >
          {group}
        </div>

        <div
          style={{
            color: "#555",
            fontSize: "28px",
            marginBottom: "56px",
          }}
        >
          매일 함께 루틴을 완성해요
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {["헬스장", "식단", "듀오링고", "독서"].map((label) => (
            <div
              key={label}
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "99px",
                padding: "8px 22px",
                color: "#666",
                fontSize: "20px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Noto Sans KR", data: font, weight: 700 }],
    }
  );
}
