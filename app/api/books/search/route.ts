import { type NextRequest } from "next/server";

interface BookResult {
  title: string;
  authors: string[];
  thumbnail: string;
  isbn: string;
}

async function searchKyobo(query: string): Promise<BookResult[]> {
  const BOOK_TYPES = new Set(["KOR", "POD"]);

  const url = new URL(
    "https://search.kyobobook.co.kr/srp/api/v2/search/autocomplete/shop",
  );
  url.searchParams.set("keyword", query);
  url.searchParams.set("gbCode", "TOT");
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("deviceType", "P");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Referer: "https://search.kyobobook.co.kr/",
    },
  });

  if (!res.ok) throw new Error(`Kyobo API error: ${res.status}`);

  const data = await res.json();
  return (data?.data?.resultDocuments ?? [])
    .filter((item: { sale_CMDT_DVSN_CODE: string }) =>
      BOOK_TYPES.has(item.sale_CMDT_DVSN_CODE),
    )
    .map(
      (item: {
        cmdt_NAME: string;
        chrc_NAME: string;
        img_URL: string;
        cmdtcode: string;
      }) => ({
        title: item.cmdt_NAME,
        authors: item.chrc_NAME ? [item.chrc_NAME] : [],
        thumbnail: item.img_URL ?? "",
        isbn: item.cmdtcode,
      }),
    );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const documents = await searchKyobo(query);
    return Response.json({ documents });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
