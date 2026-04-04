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
  const nickname = req.nextUrl.searchParams.get("nickname") ?? "누군가";
  const missingParam = req.nextUrl.searchParams.get("missing") ?? "";
  const doneParam = req.nextUrl.searchParams.get("done") ?? "";

  const missingList = missingParam.split(",").map((s) => s.trim()).filter(Boolean);
  const doneList = doneParam.split(",").map((s) => s.trim()).filter(Boolean);
  const allRoutines = [...doneList, ...missingList];

  const font = await fetchKoreanFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f4f5",
          fontFamily: "Noto Sans KR",
          padding: "40px",
          gap: "32px",
        }}
      >
        {/* Left panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "380px",
            flexShrink: 0,
            background: "#ffffff",
            borderRadius: "32px",
            padding: "52px 48px",
          }}
        >
          {/* Daily Routine label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#f4f4f5",
              borderRadius: "99px",
              padding: "8px 18px",
              marginBottom: "32px",
              width: "fit-content",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "99px",
                background: "#1a1a1a",
              }}
            />
            <span style={{ color: "#1a1a1a", fontSize: "20px", fontWeight: "700" }}>
              Daily Routine
            </span>
          </div>

          {/* Main text */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "28px" }}>
            <span
              style={{
                color: "#1a1a1a",
                fontSize: "72px",
                fontWeight: "700",
                lineHeight: "1.1",
                letterSpacing: "-2px",
              }}
            >
              아직도
            </span>
            <span
              style={{
                color: "#e63030",
                fontSize: "72px",
                fontWeight: "700",
                lineHeight: "1.1",
                letterSpacing: "-2px",
              }}
            >
              안 했어?
            </span>
          </div>

          {/* Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "36px" }}>
            <span style={{ color: "#888", fontSize: "20px", lineHeight: "1.6" }}>
              루틴을 함께 체크하고,
            </span>
            <span style={{ color: "#888", fontSize: "20px", lineHeight: "1.6" }}>
              안 하면 살짝 눌러주는 앱.
            </span>
          </div>

          {/* Nickname */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#aaa", fontSize: "18px" }}>재촉 대상</span>
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: "99px",
                padding: "6px 18px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              {nickname}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "14px",
            justifyContent: "center",
          }}
        >
          {allRoutines.map((label) => {
            const isDone = doneList.includes(label);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isDone ? "#fafafa" : "#ffffff",
                  borderRadius: "24px",
                  padding: "22px 32px",
                  opacity: isDone ? 0.55 : 1,
                  border: isDone ? "1px solid #eee" : "1px solid #ffe0e0",
                }}
              >
                <span
                  style={{
                    color: "#1a1a1a",
                    fontSize: "26px",
                    fontWeight: "700",
                  }}
                >
                  {label}
                </span>
                {isDone ? (
                  <div
                    style={{
                      background: "#1a1a1a",
                      borderRadius: "99px",
                      padding: "6px 22px",
                      color: "#fff",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    완료
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#fff0f0",
                      borderRadius: "99px",
                      padding: "6px 22px",
                      color: "#e63030",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    미완료
                  </div>
                )}
              </div>
            );
          })}
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
