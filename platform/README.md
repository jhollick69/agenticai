# GCSE Maths Lab — production platform (Next.js + Supabase + Stripe)

A deployable web app with **real accounts** (Supabase Auth), **real subscriptions**
(Stripe Checkout), and a **server-side paywall** that can't be bypassed from the browser.

> The single-file prototype (`../index.html`) still works offline and is great for demos.
> This `platform/` folder is the real, monetisable version. Deploy this folder.

---

## How the paywall actually works (the important part)

1. A user signs in with Supabase Auth → a `profiles` row is created for them.
2. They click **Upgrade** → `POST /api/checkout` creates a Stripe Checkout session → Stripe takes the payment.
3. Stripe calls **`POST /api/webhook`** → we verify Stripe's signature and set `profiles.is_premium = true` using the **service-role** key.
4. Premium pages (`/quiz/[topicId]`) read entitlement **on the server** (`lib/entitlement.ts`). Premium question data is only ever sent to the browser **after** that check passes.

Row Level Security means the browser can read its own profile but **cannot write** `is_premium` — only the webhook can. That's why this gate is real and the prototype's was not.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Stripe](https://stripe.com) account (use **test mode** while building)
- (Optional) the [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhooks

---

## Setup

### 1. Install
```bash
cd platform
npm install
```

### 2. Supabase
1. Create a project. From **Project Settings → API**, copy the **Project URL**, the **anon public** key, and the **service_role** key.
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Under **Authentication → Providers**, make sure **Email** is enabled. (For quick local testing you can turn off "Confirm email" so sign-up logs you straight in.)

### 3. Stripe
1. In **test mode**, create a **Product** (e.g. "GCSE Maths Premium") with two recurring **Prices**: monthly (£4.99) and yearly (£39). Copy each **Price ID** (`price_…`).
2. From **Developers → API keys**, copy your **Secret key** (`sk_test_…`).
3. Webhook secret:
   - **Local:** run `npm run stripe:listen` — the CLI prints a `whsec_…` secret.
   - **Production:** **Developers → Webhooks → Add endpoint** → URL `https://YOUR-DOMAIN/api/webhook`, events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret.

### 4. Environment variables
Copy `.env.example` to `.env.local` and fill in every value:
```bash
cp .env.example .env.local
```

### 5. Run
```bash
npm run dev               # app on http://localhost:3000
npm run stripe:listen     # in a second terminal, forwards Stripe webhooks locally
```

Test the flow: sign up → click a 🔒 topic → Upgrade → pay with Stripe test card
`4242 4242 4242 4242` (any future expiry, any CVC) → you return as **Premium** and the topic unlocks.

---

## Deploy (Vercel)

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com). Set **Root Directory** to `platform`.
2. Add every variable from `.env.local` in **Project → Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL` to your real domain).
3. Add the production Stripe webhook (step 3 above) pointing at `https://YOUR-DOMAIN/api/webhook`.
4. Deploy. Switch Stripe to **live mode** keys only when you're ready to take real money.

---

## What to do next

- **Migrate the full question bank** (70+ questions in `../index.html`) into `lib/content.ts`, or better, into a `questions` table so content is editable without redeploying.
- **Free trial:** add `subscription_data.trial_period_days` in `app/api/checkout/route.ts`.
- **Compliance (UK, under-18 audience):** add Privacy Policy / Terms, cookie consent, and follow the ICO Children's Code. Stripe handles card data + VAT (consider Stripe Tax).
- **Progress tracking:** store per-user scores/streaks in Supabase instead of `localStorage`.

## File map
```
app/
  layout.tsx                 top bar + entitlement-aware header
  page.tsx                   topic grid (locks premium topics)
  account/page.tsx           sign-in OR account + upgrade
  quiz/[topicId]/page.tsx    SERVER-gates premium topics, then renders the quiz
  api/checkout/route.ts      creates a Stripe Checkout session
  api/webhook/route.ts       Stripe → sets is_premium (service role)
  api/portal/route.ts        Stripe billing portal (manage/cancel)
components/
  Quiz.tsx                   quiz UI: shuffle, 50/50, concept, deeper dive, analogy
  AuthForm.tsx               Supabase email/password sign-in/up
  UpgradeButtons.tsx         starts Checkout
  AccountActions.tsx         billing portal + sign out
lib/
  supabase/{server,client,admin}.ts
  stripe.ts
  entitlement.ts             single source of truth for "is premium?"
  content.ts                 topics + questions (free vs premium)
supabase/schema.sql          profiles table + RLS + signup trigger
middleware.ts                refreshes the auth session
```
