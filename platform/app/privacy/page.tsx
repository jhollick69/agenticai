import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

// STARTER TEMPLATE — not legal advice. Fill in the [bracketed] details and have a
// solicitor review before you take real payments, especially as the audience may
// include under-18s (UK GDPR + ICO Children's Code apply).
export default function Privacy() {
  return (
    <main className="card legal">
      <div className="legalBanner">
        ⚠️ Template only — replace the [bracketed] details and get it reviewed by a solicitor
        before launch. This is not legal advice.
      </div>
      <h1>Privacy Policy</h1>
      <p className="sub">Last updated: [date]</p>

      <p>
        This Privacy Policy explains how [Your company / trading name] (&quot;we&quot;, &quot;us&quot;)
        collects and uses personal data when you use GCSE Maths Lab (the &quot;Service&quot;). We are the
        data controller. Contact us at [contact email].
      </p>

      <h2>What we collect</h2>
      <ul className="legalList">
        <li><strong>Account data:</strong> your email address and an encrypted password (handled by our auth provider, Supabase).</li>
        <li><strong>Subscription data:</strong> your plan and status. Card payments are processed by Stripe — we never see or store your full card details.</li>
        <li><strong>Usage data:</strong> basic information needed to run and secure the Service.</li>
      </ul>

      <h2>How we use it</h2>
      <ul className="legalList">
        <li>To create your account and let you sign in.</li>
        <li>To provide premium access and manage your subscription.</li>
        <li>To keep the Service secure and to comply with our legal obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We use trusted processors to run the Service: <strong>Supabase</strong> (accounts/database),
        <strong> Stripe</strong> (payments), and [hosting provider, e.g. Vercel]. We do not sell your
        personal data.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        The Service is intended for GCSE-age learners. If you are under 18, please use it with a
        parent or guardian&apos;s involvement. We aim to follow the UK ICO&apos;s Age Appropriate Design
        Code. If you believe a child has given us personal data without appropriate consent, contact
        [contact email] and we will delete it.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you can request access to, correction of, or deletion of your personal data, and
        you can object to certain processing. Email [contact email] to make a request. You can also
        complain to the ICO (ico.org.uk).
      </p>

      <h2>Retention</h2>
      <p>We keep your data for as long as your account is active, then delete or anonymise it within [period].</p>

      <h2>Changes</h2>
      <p>We may update this policy and will post the new version here with a revised date.</p>
    </main>
  );
}
