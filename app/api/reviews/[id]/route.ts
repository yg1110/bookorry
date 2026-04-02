import { type NextRequest } from "next/server";

import { supabase } from "@/lib/supabase";

async function resolveReviewMember(reviewId: string, sessionToken: string) {
  const { data: review } = await supabase
    .from("reviews")
    .select("id, member_id, books(group_id)")
    .eq("id", reviewId)
    .single();

  if (!review) return null;

  const groupId = Array.isArray(review.books)
    ? review.books[0]?.group_id
    : (review.books as { group_id: string } | null)?.group_id;

  if (!groupId) return null;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("group_id", groupId)
    .single();

  if (!member || member.id !== review.member_id) return null;

  return { reviewId: review.id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionToken = request.headers.get("x-session-token");
  if (!sessionToken)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveReviewMember(id, sessionToken);
  if (!resolved) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { content, reviewed_at } = body;

  const { error } = await supabase
    .from("reviews")
    .update({ content, reviewed_at })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionToken = request.headers.get("x-session-token");
  if (!sessionToken)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveReviewMember(id, sessionToken);
  if (!resolved) return Response.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("review_comments").delete().eq("review_id", id);

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
