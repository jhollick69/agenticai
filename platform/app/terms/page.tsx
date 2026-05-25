import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

// STARTER TEMPLATE — not legal advice. Fill in the [bracketed] details and have a
// solicitor review before launch (consumer/distance-selling rules apply to UK
// subscriptions, and your audience may include under-18s).
export default function Terms() {
  return (
    <main className="card legal">
      <div className="legalBanner">
        ⚠️ Template only — replace the [bracketed] details and get it reviewed by a solicitor
        before launch. This is not legal advice.
      </div>
      <h1>Terms of Service</h1>
      <p className="sub">Last updated: [date]</p>

      <p>
        These terms govern your use of GCSE Maths Lab (the &quot;Service&quot;), provided by [Your company /
        trading name] (&quot;we&quot;, &quot;us&quot;). By using the Service you agree to these terms. If you are under
        18, you confirm a parent or guardian agrees to them on your behalf.
      </p>

      <h2>Accounts</h2>
      <p>You&apos;re responsible for keeping your login details secure and for activity on your account. Tell us at [contact email] if you suspect unauthorised use.</p>

      <h2>Subscriptions, trials &amp; billing</h2>
      <ul className="legalList">
        <li>Premium is offered as a monthly or annual subscription at the prices shown at checkout.</li>
        <li>Premium starts with a <strong>7-day free trial</strong>. If you don&apos;t cancel before the trial ends, your chosen plan begins and your payment method is charged.</li>
        <li>Subscriptions renew automatically until cancelled. You can cancel any time from the billing portal; access continues until the end of the paid period.</li>
        <li>Payments are processed by Stripe. Prices include applicable taxes where required.</li>
      </ul>

      <h2>Cancellations &amp; refunds</h2>
      <p>
        Cancel during the free trial and you won&apos;t be charged. For your statutory cancellation rights
        and our refund approach, see [your refund policy / link]. [Adjust to match UK consumer law.]
      </p>

      <h2>Acceptable use</h2>
      <p>Don&apos;t misuse the Service, attempt to break its security, or share your account to circumvent payment. We may suspend accounts that do.</p>

      <h2>Educational content</h2>
      <p>The Service is a revision aid to support learning; it is not a guarantee of any exam result. Content is provided &quot;as is&quot; and we work to keep it accurate.</p>

      <h2>Liability</h2>
      <p>Nothing in these terms limits liability that cannot be limited by law. Otherwise, our liability is limited to the amount you paid in the previous [period]. [Have this reviewed.]</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Email [contact email].</p>
    </main>
  );
}
