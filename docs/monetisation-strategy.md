# Revision Platform — Monetisation & Build Strategy

> **Product shape:** Hybrid — a data-driven content platform for breadth across all subjects, plus a small set of flagship interactive 3D "labs" (like the existing GCSE Maths Cram Lab) as the premium hook.
> **Model:** Freemium subscription.
> **Status:** Strategy/plan. No platform code written yet — the only asset today is `index.html` (the maths lab).
> _Figures below (prices, market sizes, conversion rates) are benchmarks to validate, not hard facts._

---

## 1. What we have today

A single self-contained `index.html` (~1,600 lines):

- **Tech:** vanilla JS + Three.js (from a CDN via importmap), WebGL rendering.
- **Content:** 5 hand-built GCSE Maths topics — Pythagoras 3D, Graph Plotter, Transformations, Trig (SOHCAHTOA), Circles & Sectors.
- **Engagement:** quiz engine, points/streaks/best score, saved in `localStorage`. Marketed as ADHD-friendly.

**Honest assessment of the asset:**
- ✅ The 3D interactive labs are *genuinely rare* in GCSE revision. This is the moat.
- ✅ The gamification + ADHD-friendly angle is a real, marketable wedge (parents actively seek tools for neurodivergent kids).
- ⚠️ It is **not monetisable as-is**: no accounts, no payments, no server. A `localStorage` paywall is bypassed in seconds.
- ⚠️ Each lab is *bespoke hand-coded 3D*. This is the opposite of "all subjects" — it cannot be the way we get breadth.

---

## 2. The core strategic tension (and the resolution)

You cannot hand-build a 3D scene for every topic in History, English, Biology, etc. So:

| Layer | What it is | Cost to produce | Role |
|---|---|---|---|
| **Breadth layer** | Data-driven notes + flashcards + quizzes (defined as structured data, rendered by one generic engine) | Low per topic | Covers *all subjects*. The bulk of the product. |
| **Depth layer** | Bespoke interactive 3D/2D labs for high-value visual topics | High per topic | The premium hook + marketing/demo material. A handful only. |

**Resolution:** Breadth pays the bills via coverage; depth wins the customer via "wow". The 3D labs are the *reason people pay and share*, not the bulk of what they consume.

**Where 3D labs actually add value** (build these; don't build labs for topics that don't need them):
- Maths: geometry, transformations, graphs, vectors, trigonometry (✅ already started)
- Physics: forces, waves, circuits, moments, projectiles
- Chemistry: molecular shapes, bonding, electrolysis
- Biology: cell structure, organ systems, DNA

Humanities, English, and languages are almost entirely **breadth layer** — don't force 3D where it adds nothing.

---

## 3. The market (UK GCSE) — who we're up against

~600k+ students sit GCSEs in England each year; revision demand spikes Jan–May. The space is crowded, and the *free* tier is well-funded, so "why pay" must be obvious.

| Competitor | Model | Strength | Gap we exploit |
|---|---|---|---|
| **BBC Bitesize** | Free (public) | Comprehensive, trusted | Static, not engaging/adaptive |
| **Seneca Learning** | Freemium | Free, spaced repetition, large | Text-heavy, low "wow" |
| **Save My Exams** | Subscription (~£10/mo) | Exam-board-specific notes + questions | No interactivity, no gamification |
| **Sparx Maths / Tassomai** | B2B (schools) | Adaptive homework, school sales | Not built for self-motivated B2C revision |
| **Dr Frost / Corbettmaths / PMT** | Free | Past papers, trusted by teachers | No engagement layer |
| **Up Learn** | Premium (£££, A-level) | "A* or money back", mastery video | Expensive, not GCSE-first |

**Takeaway:** Don't compete with BBC/Seneca on *free breadth*. Compete on **engagement + interactivity + ADHD-friendly design**, exam-board-aligned, and charge for depth. Our nearest paid analogue is Save My Exams — but they have nothing like the 3D labs or the gamification.

---

## 4. Freemium model design

The whole game is: large free funnel → convert a small % to paid. Freemium ed-tech conversion is typically **1–5%**, so the free tier must attract *a lot* of students.

**Free tier (the funnel):**
- A few subjects / capped topics per subject
- Basic quizzes, daily question cap
- 1–2 sample 3D labs (the hook — let them feel the "wow")
- Progress tracking

**Premium tier (the paywall):**
- All subjects + all topics
- **All 3D labs** (the primary reason to upgrade)
- Exam-board-specific content (AQA/Edexcel/OCR variants)
- Original exam-style practice questions + worked solutions
- Progress analytics / predicted grade / weak-topic targeting
- Ad-free, offline

**Pricing (benchmark, validate):**
- B2C: ~**£5–10/month** or ~**£40–60/year**. Annual + "exam-season unlock" (Jan–May) framing converts well.
- **Parent-pays reality:** under-16s don't have cards. Design checkout for a parent buying for a child (parent account → linked student profile).
- Free trial (7 days) to let the labs sell themselves.

**Conversion levers:** free trial, exam-season urgency, referral ("unlock a topic by inviting a friend"), and the labs as inherently shareable social content.

---

## 5. Technical architecture to actually ship this

The current static file can't gate content. Here's the minimum real stack.

```
┌─────────────────────────────────────────────────────┐
│  Frontend (web-first)                                │
│  - App shell: Next.js / SvelteKit / Astro            │
│  - Generic content renderer (notes, flashcards, quiz)│
│  - 3D labs (existing Three.js code, self-hosted)     │
├─────────────────────────────────────────────────────┤
│  Auth & accounts                                     │
│  - Supabase / Clerk / Firebase                       │
│  - Parent + linked student profiles                  │
├─────────────────────────────────────────────────────┤
│  Payments / subscriptions                            │
│  - Stripe Billing (or Paddle = Merchant of Record,   │
│    handles VAT/tax for a solo founder)               │
├─────────────────────────────────────────────────────┤
│  Content store                                       │
│  - Structured content: Git-based MDX or headless CMS │
│    (Sanity/Contentful). Quizzes as JSON schema.      │
├─────────────────────────────────────────────────────┤
│  Server / entitlement check  ← CRITICAL              │
│  - Premium content served from server AFTER auth,    │
│    NOT shipped to client and hidden. A client-side   │
│    paywall is no paywall.                             │
└─────────────────────────────────────────────────────┘
Hosting: Vercel / Netlify / Cloudflare.
```

**Key technical decisions for the refactor:**
1. **Data-driven content model first.** Define a content schema (subject → exam board → topic → {notes, flashcards, questions, optional lab}). The existing maths quizzes get migrated into it. This is the single most important refactor — it's what makes "all subjects" possible.
2. **Self-host Three.js** and pin versions. Don't ship a paid product depending on `unpkg` being up.
3. **Server-side entitlement.** Premium JSON/labs load only after a verified subscription. Assume the client is hostile.
4. Keep the existing lab code — wrap it as a reusable component the platform can embed per-topic.

---

## 6. The real bottleneck: content production

Code is not the hard part. **Content volume is.** "All subjects" = subjects × exam boards (AQA/Edexcel/OCR/WJEC) × ~10–15 topics × many questions each.

- **Start narrow:** Maths + Sciences (where 3D labs shine) + **one exam board first** (AQA is largest). Expand from proof, not ambition.
- **AI-draft, expert-review:** use AI to draft notes/questions, but a subject expert *must* verify. One wrong answer destroys trust — accuracy is the entire credibility of a paid revision product.
- **Copyright:** do **not** reproduce exam-board past papers or mark schemes (copyrighted). Write *original* questions aligned to the published spec. You may say "aligned to the AQA spec" carefully; avoid implying endorsement.

---

## 7. Legal / compliance (under-18 audience — non-negotiable)

- **UK GDPR + Age Appropriate Design Code (Children's Code):** strict rules for services likely used by under-18s — data minimisation, high-privacy defaults, no manipulative "nudges". Build privacy-first from day one.
- **Parental consent + parent-pays billing.**
- Terms of Service, Privacy Policy, cookie consent.
- **Accessibility (WCAG):** also a selling point given the ADHD-friendly positioning.
- Exam-board names are trademarks — describe alignment carefully.

---

## 8. Go-to-market

- **B2C funnel:** SEO (revision content ranks well), TikTok/YouTube/Instagram (where students are — the 3D labs are inherently demo-able/viral), free tier as the top of funnel, exam-season pushes, and **parent-targeted** messaging for the ADHD/engagement angle.
- **B2B (later, higher value, more reliable revenue):** sell to schools / SENCos. Sparx and Tassomai prove schools pay. The engagement data + ADHD-friendly design is a strong school pitch.

---

## 9. Roadmap

| Phase | Goal | Scope |
|---|---|---|
| **0 — Validate (now)** | Prove demand before building billing | Polish the maths lab, put it online **free**, collect emails + usage, talk to students/parents/teachers |
| **1 — Paid MVP** | First revenue | Data-driven content engine + accounts + Stripe + free/premium gate. **Maths deep** + 3–5 flagship labs. Launch subscription. |
| **2 — Depth** | Strengthen the wedge | Add Sciences (best 3D fit), exam-board variants, progress analytics, expand gamification |
| **3 — Breadth + scale** | "All subjects" | Humanities/English/languages (mostly data-driven), mobile app (RevenueCat for app-store billing), B2B/schools |

---

## 10. Honest risks / reality check

- **Free competition is strong and funded** (BBC, Seneca, Dr Frost). Our differentiation (interactivity + gamification + ADHD-friendly) must be *real and obvious*, not cosmetic.
- **Content accuracy & exam alignment is make-or-break** and labour-intensive — the true cost centre.
- **3D doesn't scale** — discipline on where labs genuinely add value.
- **Monetising minors is sensitive** — compliance overhead + parent-pays friction.
- **Conversion is low** on freemium — the free funnel must be large, or pivot weight toward B2B/schools for steadier revenue.
- **Solo-founder bandwidth** — Phase 0/1 narrow scope is essential; "all subjects" is the destination, not the MVP.

---

## 11. Recommended immediate next steps

1. **Phase 0 validation** — get the existing maths lab hosted and public (free), add an email capture, and watch whether students actually return. Cheapest possible signal.
2. **Design the content schema** — the data model for subject/board/topic/{notes, flashcards, questions, lab}. This unlocks everything else.
3. **Decide build vs. buy on the stack** — Supabase + Stripe + Next.js is the fastest credible path for one developer.

> When you're ready, the natural first piece of *code* is the data-driven content engine (Phase 1), reusing the existing lab as the first embedded "depth" component.
