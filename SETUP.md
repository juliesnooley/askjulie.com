# Connecting the board — Supabase + Turnstile

The prompt library works right now with nothing connected. Voting, posting
questions, and prompt feedback need the two free accounts below. Budget about
30 minutes. Nothing here costs money at this scale.

Everything you paste into `app.js` is **meant to be public** — those keys only
work alongside the database rules in `schema.sql`. The two genuinely secret
values live in Supabase's own secret store and never touch this repo.

---

## 1. Supabase — the database

1. Sign up at **supabase.com** → **New project**. Any name. Pick the region
   closest to you (`West US`). Save the database password it gives you.
2. Wait for the project to finish provisioning (~2 minutes).
3. Left sidebar → **SQL Editor** → **New query**. Paste the whole of
   `supabase/schema.sql`, then **Run**. It should say Success.
4. Left sidebar → **Project Settings → API**. Copy two values:
   - **Project URL** → goes in `app.js` as `SUPABASE_URL`
   - **anon / public** key → goes in `app.js` as `SUPABASE_ANON_KEY`

> The anon key is safe in public code. Row Level Security is switched on for
> every table, and there is no insert policy anywhere — so that key can read
> the board and nothing else. It cannot write, and it cannot read votes at all.

## 2. Cloudflare Turnstile — the human check

1. Sign up at **cloudflare.com** (free). Dashboard → **Turnstile** → **Add widget**.
2. Domain: `askjulie.com`. Widget mode: **Managed**.
3. Copy the two values it gives you:
   - **Site key** → goes in `app.js` as `TURNSTILE_SITEKEY`
   - **Secret key** → goes in Supabase in step 3 below. Never in this repo.

Turnstile is invisible for almost everyone — no traffic lights, no bicycles.
A visitor only sees a checkbox if they look suspicious.

## 3. The Edge Function — the only way in

The browser must never be trusted to say "I passed the bot check." The token
is verified server-side here, and only then does anything get written.

1. Supabase → **Project Settings → Edge Functions → Secrets** → add:
   - `TURNSTILE_SECRET` — the secret key from step 2
   - `VOTER_SALT` — any long random string. Generate one with:
     `openssl rand -hex 32`
2. Supabase → **Edge Functions** → **Deploy a new function**, name it exactly
   **`submit`**, and paste the contents of `supabase/functions/submit/index.ts`.

   Or from this folder, if you'd rather use the CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase functions deploy submit
   ```

## 4. Switch it on

Edit the top of `app.js`:

```js
const CONFIG = {
  SUPABASE_URL:      "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGci...",
  TURNSTILE_SITEKEY: "0x4AAAAAAA...",
  CONTACT_EMAIL:     "hello@askjulie.com"
};
```

Then publish:

```bash
git add -A && git commit -m "Connect the board" && git push
```

Give it a minute, reload askjulie.com, and the board should load instead of
showing the not-connected notice.

---

## Running it day to day

**Moderating.** Supabase → **Table Editor → questions**. Set a row's `status`
to `hidden` and it disappears from the site immediately. Set it to `answered`
once you've built the prompt, and it shows as *in the library*.

**Adding a prompt.** Edit the `PROMPTS` array at the top of `app.js` — copy an
existing block, give it the next `P-0NN` number, commit, push. Prompts live in
this repo on purpose: they're versioned, you can edit them on github.com from
any device, and Google can read them.

**What the vote counting really does.** A vote is tied to a hash of the
voter's IP address, so one household counts once per question. That stops
casual double-voting and bots. It does **not** stop someone determined who
changes networks — real one-person-one-vote needs accounts, which would cost
you most of your visitors. The current tradeoff is the right one for a site
this size; revisit it if the board ever gets gamed.

**Costs.** Supabase free tier covers this comfortably. Turnstile is free with
no meaningful limit. The site itself is on GitHub Pages, also free.
