import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Kakao API key not configured" }, { status: 500 });
  }

  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    return Response.json({ error: "Kakao API error" }, { status: res.status });
  }

  const data = await res.json();
  return Response.json(data);
}
