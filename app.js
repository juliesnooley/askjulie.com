/* Ask Julie — prompt library + public question board.
   Fill in CONFIG once Supabase and Turnstile exist (see SETUP.md).
   Until then the library works fully and the board shows a clear
   "not connected" state rather than pretending to save anything. */

const CONFIG = {
  SUPABASE_URL:      "",   // https://<project-ref>.supabase.co
  SUPABASE_ANON_KEY: "",   // the anon/publishable key — safe in public code
  TURNSTILE_SITEKEY: "",   // Cloudflare Turnstile site key — safe in public code
  CONTACT_EMAIL:     "hello@askjulie.com"
};

const CONNECTED = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

/* ------------------------------------------------------------------ */
/* The library. Prompts live here in the repo — versioned, searchable   */
/* by Google, and editable on github.com without touching a database.   */
/* ------------------------------------------------------------------ */

const PROMPTS = [
{
  id: "P-001", cat: "Teaching", title: "Teach one topic to three different ages at once",
  tags: ["multi-age", "any subject", "same-day"],
  text: `You are helping a homeschooling parent teach one topic to several children at the same time.

Topic: [TOPIC]
Children: [AGES, e.g. 6, 9 and 13]

For each child give me:
1. A one-sentence explanation pitched at that age
2. One question I can ask them to check they followed it
3. One hands-on thing we can do together in under 15 minutes

Then give me ONE activity all of them can do together, where the older
children have a harder job rather than a separate job.

Keep the whole thing to a single screen I can read while they are already
sitting at the table. No introduction, no summary, no encouragement.`,
  howto: `The last line matters more than it looks. Without it I get three paragraphs of preamble about what a wonderful learning opportunity this is, and I have to scroll while three children wait.`
},
{
  id: "P-002", cat: "Reading", title: "Pull a spelling list out of what they're already reading",
  tags: ["spelling", "ages 6-11", "no new material"],
  text: `Here is a passage my child is reading:

[PASTE THE PASSAGE]

My child is [AGE] and consistently gets [PATTERN, e.g. words ending in -tion,
or silent e] wrong.

Pull 12 spelling words from this passage that practise that pattern.
Group them by the specific rule each one demonstrates, and name the rule.
Give one sentence per word, using the meaning it has in this passage.

Only use words that actually appear in the passage above. If there are
fewer than 12, give me fewer and say so — do not pad the list.`,
  howto: `The "do not pad the list" instruction is doing real work. Ask for twelve and you will get twelve, four of which were quietly invented.`
},
{
  id: "P-003", cat: "Teaching", title: "Socratic tutor that won't hand over the answer",
  tags: ["stuck kid", "one-on-one", "any subject"],
  text: `Act as a patient tutor for a [AGE]-year-old who is stuck on [TOPIC].

Rules:
- Do not give the answer, and do not give a worked example.
- Ask ONE question at a time, then stop and wait for the reply.
- If the answer is wrong, do not correct it. Ask a question whose answer
  will make the contradiction obvious to them.
- Keep every message under three sentences.
- If you become confident the real gap is an earlier skill rather than
  [TOPIC], stop the tutoring and tell me privately, in brackets, what that
  skill is and what evidence made you think so.

Start by asking what they already think the answer might be.`,
  howto: `I sit next to them and type their answers in. The bracketed aside is the useful part for me — it has caught a fractions problem that was really a division problem more than once.`
},
{
  id: "P-004", cat: "Records", title: "Course description for a homeschool transcript",
  tags: ["high school", "transcript", "admissions"],
  text: `Write a course description for a homeschool transcript.

Course title: [NAME]
Grade level: [9/10/11/12]
Texts and materials used: [LIST]
Work the student actually completed: [SUMMARY]
Approximate hours: [N]

Write 3–4 sentences in the neutral, factual register a school registrar
would use. Cover what the course contained, what the student produced,
and how it was assessed.

No marketing language, no adjectives about the student, no first person.
Do not claim any accreditation, alignment to a standard, or approval that
I have not stated above.`,
  howto: `That last line exists because I was once handed a description claiming the course "meets California A–G requirements." It did not, and I nearly sent it.`
},
{
  id: "P-005", cat: "Assessment", title: "Turn a chapter into comprehension questions",
  tags: ["any subject", "ages 8-14", "printable"],
  text: `Here is a chapter my child has just read:

[PASTE OR ATTACH]

Generate 8 comprehension questions for a [AGE]-year-old, ordered by depth:
- 3 that can be answered directly from the text
- 3 that require inference across paragraphs
- 2 that ask for an opinion which must be defended with evidence from the text

Label which group each question belongs to.

Then, after a line of dashes, give the answers — so I can fold the page
and hand them the top half.`,
  howto: `The fold is the whole trick. Ask for answers inline and you get an answer key you have to reformat before it is usable on paper.`
},
{
  id: "P-006", cat: "Planning", title: "Next week's plan, from the course of study you already wrote",
  tags: ["weekly planning", "multi-age", "realistic"],
  text: `Here is my course of study for the year:

[PASTE]

We school [N] days a week and have [N] weeks left in the year.

Build next week as a table: day, subject, what we actually do, how long.

Constraints:
- I have a [AGE]-year-old and a [AGE]-year-old sharing my attention.
- Anything needing me one-on-one goes in the morning.
- Nothing gets more than 30 minutes for the younger child.
- Leave one afternoon completely empty. Do not fill it.

Assume the week will go wrong somewhere and tell me which single item is
the one to drop when it does.`,
  howto: `"Leave one afternoon empty" and "tell me what to drop" are the two lines that made this usable. Every plan I got before was a plan for a family that does not get sick.`
},
{
  id: "P-007", cat: "Math", title: "Diagnose the actual gap behind repeated mistakes",
  tags: ["math", "diagnosis", "ages 7-14"],
  text: `My [AGE]-year-old keeps making mistakes on [TOPIC].
Here is their actual work on three problems:

[PASTE OR DESCRIBE EXACTLY WHAT THEY WROTE]

Do not tell me they need more practice, and do not give me encouragement.

Tell me:
1. Which specific prerequisite skill these errors point to
2. What in the work above is your evidence for that
3. Five problems that test ONLY that prerequisite, no [TOPIC] involved

If the three examples are not enough to tell, say so and tell me what to
put in front of them to find out.`,
  howto: `Point 2 keeps it honest. Without it the diagnosis sounds equally confident whether or not the work actually supports it.`
},
{
  id: "P-008", cat: "Reading", title: "Read-aloud list that won't send you after books that don't exist",
  tags: ["read-aloud", "library", "all ages"],
  text: `Suggest 10 read-aloud books for a family with children aged [AGES].

Constraints: [e.g. nothing scary at bedtime, no series we'd have to finish,
must survive being read in 20-minute chunks]

For each book give: the author, roughly what reading level, how long it
takes to read aloud, and one sentence on what makes it worth the time.

Prefer books that have been in print for years and are in most public
library systems, over recent releases.

Do not include any book unless you are confident it exists and the author
is correct. If you are unsure about a title, leave it out and give me nine.`,
  howto: `This is the prompt I'd give someone if they only took one. Invented book titles are the single most common way AI wastes a homeschool parent's afternoon.`
}
];

/* ------------------------------------------------------------------ */
/* Supabase REST + Turnstile                                           */
/* ------------------------------------------------------------------ */

const rest = (path, opts = {}) => fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`, {
  ...opts,
  headers: {
    apikey: CONFIG.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...(opts.headers || {})
  }
});

/* All writes go through one Edge Function so the Turnstile token is
   verified server-side. A bot check that only runs in the browser is
   not a bot check. */
async function write(action, payload) {
  const token = await turnstileToken();
  const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY },
    body: JSON.stringify({ action, ...payload, turnstileToken: token })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

let tsWidget = null;
function loadTurnstile() {
  if (!CONFIG.TURNSTILE_SITEKEY) return Promise.resolve(false);
  if (window.turnstile) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}
async function turnstileToken() {
  const ok = await loadTurnstile();
  if (!ok || !window.turnstile) return null;
  if (tsWidget === null) {
    tsWidget = window.turnstile.render("#ts-slot", {
      sitekey: CONFIG.TURNSTILE_SITEKEY,
      appearance: "interaction-only",
      execution: "execute"
    });
  }
  return new Promise((resolve) => {
    window.turnstile.reset(tsWidget);
    window.turnstile.execute(tsWidget, { callback: resolve, "error-callback": () => resolve(null) });
  });
}

/* This browser's own record of what it has voted on. Honest about what it
   is: a courtesy so the UI reflects your own actions, not vote security.
   Real duplicate control is the Edge Function's rate limit. */
const voted = {
  key: "askjulie.voted",
  all() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; } },
  has(id) { return this.all().includes(id); },
  add(id) { try { localStorage.setItem(this.key, JSON.stringify([...this.all(), id])); } catch {} }
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

function renderLibrary() {
  const host = document.getElementById("entries");
  host.innerHTML = PROMPTS.map((p, i) => `
    <details class="entry" data-cat="${esc(p.cat)}"${i === 0 ? " open" : ""}>
      <summary>
        <span class="num">${esc(p.id)}</span>
        <span class="q">${esc(p.title)}</span>
        <span class="cat">${esc(p.cat)}</span>
      </summary>
      <div class="body">
        <div class="meta">${p.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
        <div class="promptbox">
          <pre id="txt-${p.id}">${esc(p.text)}</pre>
          <div class="bar">
            <span>Replace anything in [brackets]</span>
            <button class="btn sm ghost" type="button" data-copy="${p.id}">Copy prompt</button>
          </div>
        </div>
        <p class="howto"><b>Why it's written that way.</b> ${esc(p.howto)}</p>
        <div class="verdict" data-prompt="${p.id}">
          <span class="lbl">Did this work for you?</span>
          <button class="btn sm ghost" type="button" data-fb="worked" ${CONNECTED ? "" : "disabled"}>It worked</button>
          <button class="btn sm ghost" type="button" data-fb="failed" ${CONNECTED ? "" : "disabled"}>It didn't</button>
          <span class="tally" data-tally="${p.id}">${CONNECTED ? "&hellip;" : ""}</span>
          ${CONNECTED ? "" : '<span class="offline">Needs Supabase</span>'}
        </div>
      </div>
    </details>`).join("");
  document.getElementById("pcount").textContent = PROMPTS.length;
}

function wireLibrary() {
  const host = document.getElementById("entries");

  host.addEventListener("click", async (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      const text = document.getElementById(`txt-${copy.dataset.copy}`).textContent;
      try { await navigator.clipboard.writeText(text); } catch {}
      const was = copy.textContent;
      copy.textContent = "Copied";
      setTimeout(() => { copy.textContent = was; }, 1600);
      return;
    }
    const fb = e.target.closest("[data-fb]");
    if (fb && CONNECTED) {
      const wrap = fb.closest("[data-prompt]");
      const id = wrap.dataset.prompt;
      wrap.querySelectorAll("[data-fb]").forEach((b) => (b.disabled = true));
      try {
        await write("feedback", { prompt_id: id, verdict: fb.dataset.fb });
        await loadTallies();
        wrap.querySelector(".tally").insertAdjacentHTML("afterend",
          ' <span class="tally" style="color:var(--green)">thank you</span>');
      } catch (err) {
        wrap.querySelector(".tally").textContent = err.message;
        wrap.querySelectorAll("[data-fb]").forEach((b) => (b.disabled = false));
      }
    }
  });

  const search = document.getElementById("p-search");
  const chips = [...document.querySelectorAll("#p-chips .chip")];
  const empty = document.getElementById("p-empty");
  let cat = "all";

  const apply = () => {
    const term = (search.value || "").trim().toLowerCase();
    let shown = 0;
    [...host.children].forEach((el) => {
      const okCat = cat === "all" || el.dataset.cat === cat;
      const okTerm = !term || el.textContent.toLowerCase().includes(term);
      el.hidden = !(okCat && okTerm);
      if (!el.hidden) { shown++; if (term) el.open = true; }
    });
    empty.hidden = shown !== 0;
  };
  search.addEventListener("input", apply);
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    cat = chip.dataset.cat === "all" ? "all" : chip.textContent.trim();
    apply();
  }));
}

async function loadTallies() {
  if (!CONNECTED) return;
  try {
    const res = await rest("prompt_feedback?select=prompt_id,verdict");
    if (!res.ok) return;
    const rows = await res.json();
    const agg = {};
    rows.forEach((r) => {
      agg[r.prompt_id] = agg[r.prompt_id] || { worked: 0, failed: 0 };
      agg[r.prompt_id][r.verdict]++;
    });
    document.querySelectorAll("[data-tally]").forEach((el) => {
      const a = agg[el.dataset.tally];
      el.textContent = a ? `${a.worked} worked · ${a.failed} didn't` : "no reports yet";
    });
  } catch {}
}

/* ------------------------------------------------------------------ */
/* Question board                                                      */
/* ------------------------------------------------------------------ */

function boardOffline(msg) {
  document.getElementById("board-state").innerHTML =
    `<div class="notice"><b>The board isn't connected yet.</b><span>${esc(msg)}</span></div>`;
  document.getElementById("qlist").innerHTML = "";
  document.getElementById("q-submit").disabled = true;
  document.getElementById("qopen").textContent = "—";
}

async function loadBoard() {
  if (!CONNECTED) {
    boardOffline("Voting and posting start working as soon as the Supabase keys are filled in at the top of app.js. Everything else on this page already works.");
    return;
  }
  try {
    const res = await rest("questions?select=id,body,name,category,votes,status&status=neq.hidden&order=votes.desc,created_at.desc&limit=100");
    if (!res.ok) throw new Error(`Could not load the board (${res.status})`);
    const rows = await res.json();
    document.getElementById("board-state").innerHTML = "";
    document.getElementById("qopen").textContent = rows.filter((r) => r.status !== "answered").length;
    document.getElementById("q-empty").hidden = rows.length !== 0;
    document.getElementById("qlist").innerHTML = rows.map((r) => `
      <div class="qrow">
        <button class="vote" data-vote="${esc(r.id)}"
                aria-pressed="${voted.has(r.id)}" ${voted.has(r.id) ? "disabled" : ""}
                aria-label="Vote for this question">
          <span class="n">${Number(r.votes) || 0}</span><span class="c">votes</span>
        </button>
        <span class="t">${esc(r.body)}${r.name ? ` <span class="tally">— ${esc(r.name)}</span>` : ""}</span>
        <span class="st ${r.status === "answered" ? "answered" : ""}">${esc(r.status === "answered" ? "in the library" : r.category || "")}</span>
      </div>`).join("");
  } catch (err) {
    boardOffline(err.message);
  }
}

function wireBoard() {
  document.getElementById("qlist").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-vote]");
    if (!btn || btn.disabled) return;
    const id = btn.dataset.vote;
    btn.disabled = true;
    try {
      await write("vote", { question_id: id });
      voted.add(id);
      btn.setAttribute("aria-pressed", "true");
      const n = btn.querySelector(".n");
      n.textContent = (Number(n.textContent) || 0) + 1;
    } catch (err) {
      btn.disabled = false;
      document.getElementById("board-state").innerHTML =
        `<div class="notice"><b>That vote didn't go through.</b><span>${esc(err.message)}</span></div>`;
    }
  });

  const form = document.getElementById("askform");
  const notice = document.getElementById("q-notice");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = form.question.value.trim();
    if (!body) { form.question.focus(); form.question.style.borderColor = "var(--accent)"; return; }

    if (!CONNECTED) {
      notice.hidden = false;
      notice.innerHTML =
        `<b>Not connected yet — nothing was saved.</b>` +
        `<span>Copy this and email it to <a href="mailto:${CONFIG.CONTACT_EMAIL}">${CONFIG.CONTACT_EMAIL}</a> and it will go on the board by hand.</span>` +
        `<pre>${esc(body)}</pre>`;
      return;
    }
    const btn = document.getElementById("q-submit");
    btn.disabled = true; btn.textContent = "Posting…";
    try {
      await write("question", { body, name: form.name.value.trim(), category: form.category.value });
      form.reset();
      notice.hidden = false;
      notice.innerHTML = "<b>Posted.</b><span>It's on the board and open for votes.</span>";
      await loadBoard();
    } catch (err) {
      notice.hidden = false;
      notice.innerHTML = `<b>That didn't post.</b><span>${esc(err.message)}</span><pre>${esc(body)}</pre>`;
    } finally {
      btn.disabled = false; btn.textContent = "Post to the board";
    }
  });
}

/* ------------------------------------------------------------------ */

renderLibrary();
wireLibrary();
wireBoard();
loadBoard();
loadTallies();
