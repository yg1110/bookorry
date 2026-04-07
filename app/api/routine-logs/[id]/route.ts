import { type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

async function resolveOwner(logId: string, sessionToken: string) {
  const { data: log } = await supabase
    .from("routine_logs")
    .select("id, member_id, group_id, type, review_id")
    .eq("id", logId)
    .single();

  if (!log) return null;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("group_id", log.group_id)
    .single();

  if (!member || member.id !== log.member_id) return null;

  return log;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionToken = request.headers.get("x-session-token");
  if (!sessionToken)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const log = await resolveOwner(id, sessionToken);
  if (!log) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.photo_url !== undefined) updates.photo_url = body.photo_url;
  if (body.photo_urls !== undefined) updates.photo_urls = body.photo_urls;
  if (body.text_content !== undefined) updates.text_content = body.text_content;
  if (body.log_date !== undefined) updates.log_date = body.log_date;

  const { error } = await supabase
    .from("routine_logs")
    .update(updates)
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

  const log = await resolveOwner(id, sessionToken);
  if (!log) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("routine_logs").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
