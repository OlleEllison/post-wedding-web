// Server-authoritative API for guest memories and photo records.
// Every write is bound to the guest id inside a signed session token,
// so ownership can never be spoofed from the browser.
import {
  checkRateLimit,
  clientIp,
  corsHeaders,
  json,
  recordEvent,
  serviceClient,
  verifySessionToken,
} from "../_shared/session.ts";

const MEMORY_LIMIT_PER_WINDOW = 5;
const MEMORY_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_LIMIT_PER_WINDOW = 60;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const guestId = await verifySessionToken(body?.token);

    if (!guestId) {
      return json({ error: "Ogiltig eller utgången session" }, 401);
    }

    const supabase = serviceClient();
    const ip = clientIp(req);

    switch (action) {
      case "list_memories": {
        const { data, error } = await supabase
          .from("wedding_memories")
          .select("id, name, message, created_at, posted_by")
          .order("created_at", { ascending: false })
          .limit(1000);
        if (error) throw error;
        const memories = (data ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          message: m.message,
          created_at: m.created_at,
          canDelete: m.posted_by === guestId,
        }));
        return json({ memories });
      }

      case "post_memory": {
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const message = typeof body?.message === "string"
          ? body.message.trim()
          : "";
        if (!name || !message) {
          return json({ error: "Namn och meddelande krävs" }, 400);
        }
        if (name.length > 50 || message.length > 280) {
          return json({ error: "Texten är för lång" }, 400);
        }

        const allowedIp = await checkRateLimit(
          supabase,
          "memory",
          ip,
          MEMORY_LIMIT_PER_WINDOW,
          MEMORY_WINDOW_MS,
        );
        const allowedGuest = await checkRateLimit(
          supabase,
          "memory",
          guestId,
          MEMORY_LIMIT_PER_WINDOW,
          MEMORY_WINDOW_MS,
        );
        if (!allowedIp || !allowedGuest) {
          return json(
            { error: "Du skickar för många minnen. Vänta en stund." },
            429,
          );
        }

        const { data, error } = await supabase
          .from("wedding_memories")
          .insert({ name, message, posted_by: guestId })
          .select("id, name, message, created_at")
          .single();
        if (error) throw error;

        await recordEvent(supabase, "memory", ip, true);
        await recordEvent(supabase, "memory", guestId, true);

        return json({ memory: { ...data, canDelete: true } });
      }

      case "delete_memory": {
        const id = body?.id;
        if (typeof id !== "string") return json({ error: "Ogiltigt id" }, 400);
        const { data, error } = await supabase
          .from("wedding_memories")
          .delete()
          .eq("id", id)
          .eq("posted_by", guestId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          return json({ error: "Du kan bara ta bort dina egna minnen" }, 403);
        }
        return json({ success: true });
      }

      case "register_photo": {
        const filePath = typeof body?.filePath === "string"
          ? body.filePath
          : "";
        const fileName = typeof body?.fileName === "string"
          ? body.fileName.slice(0, 200)
          : "";
        // Only accept the flat, server-shaped names we generate client-side.
        if (!/^[0-9a-f-]{36}\.[A-Za-z0-9]{1,10}$/.test(filePath)) {
          return json({ error: "Ogiltigt filnamn" }, 400);
        }
        const allowed = await checkRateLimit(
          supabase,
          "upload",
          ip,
          UPLOAD_LIMIT_PER_WINDOW,
          UPLOAD_WINDOW_MS,
        );
        if (!allowed) {
          return json(
            { error: "För många uppladdningar. Vänta en stund." },
            429,
          );
        }
        const { data, error } = await supabase
          .from("wedding_photos")
          .insert({
            file_path: filePath,
            file_name: fileName || filePath,
            uploaded_by: guestId,
          })
          .select("id, file_path, file_name, created_at")
          .single();
        if (error) throw error;
        await recordEvent(supabase, "upload", ip, true);
        return json({ photo: data });
      }

      case "delete_photo": {
        const id = body?.id;
        if (typeof id !== "string") return json({ error: "Ogiltigt id" }, 400);
        const { data: photo, error: fetchError } = await supabase
          .from("wedding_photos")
          .select("id, file_path, uploaded_by")
          .eq("id", id)
          .maybeSingle();
        if (fetchError) throw fetchError;
        if (!photo || photo.uploaded_by !== guestId) {
          return json({ error: "Du kan bara ta bort dina egna bilder" }, 403);
        }
        // Service role bypasses storage RLS, so the file is really removed.
        await supabase.storage.from("wedding-photos").remove([photo.file_path]);
        const { error } = await supabase
          .from("wedding_photos")
          .delete()
          .eq("id", id)
          .eq("uploaded_by", guestId);
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: "Okänd åtgärd" }, 400);
    }
  } catch (error) {
    console.error("guest-content error:", error);
    return json({ error: "Något gick fel" }, 500);
  }
});
