# Setup checklist (no coding experience needed)

This is the friendly, click-by-click version. Work top to bottom and tick each box.
Anything in `code font` is something you copy/paste exactly. The more technical
reference is in [`README.md`](README.md).

You'll need three free accounts: **Supabase** (logins + database), **Stripe**
(payments), and later **Vercel** (to put it on the internet). Card details are only
needed to take *real* money — everything below uses free "test mode".

---

## Part 1 — Get it running on your computer

- [ ] Install **Node.js** (the "LTS" version) from <https://nodejs.org>. This lets your computer run the app.
- [ ] Open a **Terminal** (Mac: "Terminal" app · Windows: "PowerShell").
- [ ] Go into the project's `platform` folder. Example: `cd Downloads/agenticai/platform`
- [ ] Type `npm install` and press Enter. Wait for it to finish (one-time, ~30 seconds).

Don't run it yet — first we need your keys (Parts 2–4).

---

## Part 2 — Supabase (accounts + database)

- [ ] Go to <https://supabase.com> → **Start your project** → create a new project. Pick any name and a strong database password (you won't need it again here).
- [ ] In the left sidebar: **Project Settings → API**. Keep this tab open — you'll copy three things from it in Part 4:
  - **Project URL**
  - **anon public** key
  - **service_role** key  *(secret — treat like a password)*
- [ ] In the left sidebar: **SQL Editor → New query**. Open the file `platform/supabase/schema.sql`, copy **all** of it, paste it in, and press **Run**. You should see "Success". *(This builds the tables that remember who has paid and each learner's progress. It's safe to re-run any time if the file changes.)*
- [ ] In the left sidebar: **Authentication → Providers → Email** → make sure it's **enabled**. While testing, you can switch **off** "Confirm email" so sign-up logs you straight in.
- [ ] In **Authentication → URL Configuration**, set the **Site URL** (e.g. `http://localhost:3000` for now, your Vercel URL later) and add both `http://localhost:3000/reset-password` and `https://YOUR-VERCEL-URL/reset-password` to **Redirect URLs**. *(This lets the "forgot password" email link return to your app.)*

---

## Part 3 — Stripe (payments)

Make sure the **Test mode** toggle (top-right of the Stripe dashboard) is **ON** for all of this.

- [ ] Go to <https://stripe.com> and create an account.
- [ ] **Product catalogue → Add product**. Name it e.g. "GCSE Maths Premium". Add **two** prices:
  - a **monthly recurring** price (e.g. £4.99 / month)
  - a **yearly recurring** price (e.g. £39 / year)
- [ ] Click each price and copy its **Price ID** (looks like `price_1AbC...`). You need both.
- [ ] **Developers → API keys** → copy the **Secret key** (`sk_test_...`).
- [ ] Leave the webhook for now — the easiest way to test locally is the Stripe CLI, covered in Part 5. *(For the live site, Part 6 sets up the real webhook.)*

---

## Part 4 — Paste your keys in

- [ ] In the `platform` folder, find the file `.env.example`. Make a copy of it named **`.env.local`**.
- [ ] Open `.env.local` in any text editor and fill in each value with what you copied:

| In the file | Paste from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key |
| `STRIPE_SECRET_KEY` | Stripe **Secret key** |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` | your **monthly** Price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL` | your **yearly** Price ID |
| `STRIPE_WEBHOOK_SECRET` | filled in Part 5 |

- [ ] Save the file. **Never share `.env.local` or commit it to GitHub** — it's already ignored for you.

---

## Part 5 — Run it and test a payment

- [ ] Install the **Stripe CLI**: <https://stripe.com/docs/stripe-cli> → then run `stripe login` once.
- [ ] In your first Terminal (in `platform`): `npm run dev` → open <http://localhost:3000>.
- [ ] In a **second** Terminal (also in `platform`): `npm run stripe:listen`. It prints a line with `whsec_...` — copy that into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then stop (`Ctrl+C`) and re-run `npm run dev` so it picks up the new value.
- [ ] Now test the whole journey:
  - [ ] Click **Sign in** → create an account with any email + password.
  - [ ] Click a locked (🔒) topic → you're sent to the upgrade page.
  - [ ] Click a plan → on Stripe's page pay with the test card **`4242 4242 4242 4242`**, any future expiry date, any 3-digit CVC, any postcode.
  - [ ] You return to the app as **✦ Premium** and the locked topics open. 🎉

If that works, the money plumbing is correct.

---

## Part 6 — Put it on the internet (Vercel)

- [ ] Push this project to **GitHub** (ask me and I can help, or use GitHub Desktop).
- [ ] Go to <https://vercel.com>, sign in with GitHub, **Add New → Project**, and import the repo.
- [ ] In the import screen set **Root Directory** to `platform`.
- [ ] Under **Environment Variables**, add every line from your `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to your real Vercel URL (e.g. `https://your-app.vercel.app`).
- [ ] Click **Deploy**.
- [ ] Back in **Stripe → Developers → Webhooks → Add endpoint**:
  - Endpoint URL: `https://YOUR-VERCEL-URL/api/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copy the new signing secret (`whsec_...`) into the `STRIPE_WEBHOOK_SECRET` env var **in Vercel**, then redeploy.

---

## When you're ready for real money

- [ ] In Stripe, switch **off** Test mode and redo Part 3 (product + prices) and Part 6's webhook with the **live** keys (`sk_live_...`, `whsec_...`). Update the env vars in Vercel.
- [ ] Good to know: every plan already starts with a **7-day free trial** (set in `app/api/checkout/route.ts`) — cards aren't charged until day 8.

## Before you take real payments (important, not optional)

- [ ] Add a **Privacy Policy** and **Terms** page.
- [ ] Because the audience is under 18, follow the UK **ICO Children's Code** (age-appropriate design). If in doubt, get a quick legal review.
- [ ] Consider enabling **Stripe Tax** so VAT is handled correctly.

---

Stuck on any step? Tell me which box you're on and what you see, and I'll walk you through it.
