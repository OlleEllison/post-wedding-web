// Shared helpers: CORS, HMAC-signed guest session tokens and rate limiting.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const serviceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

const encoder = new TextEncoder();

const signingKey = async (): Promise<CryptoKey> => {
  const secret = Deno.env.get("WEDDING_SITE_PASSWORD");
  if (!secret) throw new Error("WEDDING_SITE_PASSWORD not configured");
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(`wedding-session::${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

/** Issues a signed token: `<guestId>.<expiresAt>.<hmac>` */
export async function issueSessionToken(guestId?: string): Promise<string> {
  const id = guestId && /^[0-9a-f-]{36}$/.test(guestId)
    ? guestId
    : crypto.randomUUID();
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${id}.${exp}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    encoder.encode(payload),
  );
  return `${payload}.${toHex(sig)}`;
}

/** Returns the guest id when the token is authentic and unexpired, otherwise null. */
export async function verifySessionToken(
  token: unknown,
): Promise<string | null> {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [guestId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  let sigBytes: Uint8Array;
  try {
    sigBytes = new Uint8Array(
      (sig.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16)),
    );
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify(
    "HMAC",
    await signingKey(),
    sigBytes,
    encoder.encode(`${guestId}.${exp}`),
  );
  return ok ? guestId : null;
}

export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
  req.headers.get("cf-connecting-ip") ||
  "unknown";

/**
 * Counts recent events of a kind for an identifier and records the current one.
 * Returns true when the caller is allowed to proceed.
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof serviceClient>,
  kind: string,
  identifier: string,
  limit: number,
  windowMs: number,
  onlyFailures = false,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();
  let query = supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("identifier", identifier)
    .gte("created_at", since);
  if (onlyFailures) query = query.eq("success", false);
  const { count } = await query;
  return (count ?? 0) < limit;
}

export async function recordEvent(
  supabase: ReturnType<typeof serviceClient>,
  kind: string,
  identifier: string,
  success: boolean,
) {
  await supabase
    .from("rate_limit_events")
    .insert({ kind, identifier, success });
}
