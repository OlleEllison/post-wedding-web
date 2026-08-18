import {
  checkRateLimit,
  clientIp,
  corsHeaders,
  issueSessionToken,
  json,
  recordEvent,
  serviceClient,
} from "../_shared/session.ts";

const MAX_FAILED_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password;
    const existingGuestId = typeof body?.guestId === "string"
      ? body.guestId
      : undefined;

    if (!password || typeof password !== "string" || password.length > 200) {
      return json({ success: false, error: "Password is required" }, 400);
    }

    const correctPassword = Deno.env.get("WEDDING_SITE_PASSWORD");
    if (!correctPassword) {
      console.error("WEDDING_SITE_PASSWORD not configured");
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    const supabase = serviceClient();
    const ip = clientIp(req);

    const allowed = await checkRateLimit(
      supabase,
      "password",
      ip,
      MAX_FAILED_ATTEMPTS,
      WINDOW_MS,
      true,
    );
    if (!allowed) {
      return json(
        {
          success: false,
          error: "För många försök. Vänta 15 minuter och försök igen.",
        },
        429,
      );
    }

    const isValid = password.trim() === correctPassword.trim();
    await recordEvent(supabase, "password", ip, isValid);

    if (!isValid) {
      // Small delay to slow down scripted guessing.
      await new Promise((r) => setTimeout(r, 500));
      return json({ success: false });
    }

    const token = await issueSessionToken(existingGuestId);
    return json({ success: true, token });
  } catch (error) {
    console.error("Error verifying password:", error);
    return json({ success: false, error: "Invalid request" }, 400);
  }
});
