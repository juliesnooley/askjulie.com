// Ask Julie — the only write path into the database.
// Verifies the Cloudflare Turnstile token server-side, then writes with the
// service-role key. Deploy from the Supabase dashboard (Edge Functions ->
// Deploy a new function) or with `supabase functions deploy submit`.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   TURNSTILE_SECRET   from the Cloudflare Turnstile widget
//   VOTER_SALT         any long random string; makes hashed IPs unguessable
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

async function voterHash(req: Request): Promise<string> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const data = new TextEncoder().encode(ip + (Deno.env.get("VOTER_SALT") ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function humanVerified(token: unknown, req: Request): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true; // not configured yet — fail open so the site works before Cloudflare is set up
  if (typeof token !== "string" || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const out = await res.json().catch(() => ({ success: false }));
  return out.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  if (!(await humanVerified(payload.turnstileToken, req))) {
    return json({ error: "Could not confirm you're a person. Reload and try again." }, 403);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const hash = await voterHash(req);

  try {
    switch (payload.action) {
      case "question": {
        const body = String(payload.body ?? "").trim();
        if (body.length < 5 || body.length > 400) return json({ error: "Between 5 and 400 characters, please." }, 400);

        const hourAgo = new Date(Date.now() - 3600_000).toISOString();
        const { count } = await db.from("questions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", hourAgo)
          .eq("category", String(payload.category ?? ""));
        if ((count ?? 0) > 40) return json({ error: "The board is busy right now — try again shortly." }, 429);

        const { error } = await db.from("questions").insert({
          body,
          name: String(payload.name ?? "").trim().slice(0, 40) || null,
          category: String(payload.category ?? "").slice(0, 40) || null,
        });
        if (error) throw error;
        return json({ ok: true });
      }

      case "vote": {
        const { data, error } = await db.rpc("cast_vote", { q: payload.question_id, vh: hash });
        if (error) {
          if (String(error.message).includes("already_voted")) return json({ error: "You've already voted on that one." }, 409);
          throw error;
        }
        return json({ ok: true, votes: data });
      }

      case "feedback": {
        const verdict = payload.verdict === "worked" ? "worked" : payload.verdict === "failed" ? "failed" : null;
        if (!verdict) return json({ error: "Unknown verdict" }, 400);
        const { error } = await db.from("prompt_feedback").upsert({
          prompt_id: String(payload.prompt_id ?? "").slice(0, 20),
          verdict,
          note: payload.note ? String(payload.note).slice(0, 600) : null,
          voter_hash: hash,
        }, { onConflict: "prompt_id,voter_hash" });
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong saving that." }, 500);
  }
});
