import Link from "next/link";
import { getEntitlement } from "@/lib/entitlement";
import { getProgressMap } from "@/lib/progress";
import AuthForm from "@/components/AuthForm";
import UpgradeButtons from "@/components/UpgradeButtons";
import AccountActions from "@/components/AccountActions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { upgrade?: string; status?: string };
}) {
  const [ent, progress] = await Promise.all([getEntitlement(), getProgressMap()]);
  const attempted = Object.keys(progress).length;
  const mastered = Object.values(progress).filter((p) => p.completed).length;

  if (!ent.signedIn) {
    return (
      <main className="card">
        <h1>Sign in</h1>
        <p className="sub">
          Sign in (or create an account) to save progress and manage your subscription.
        </p>
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Your account</h1>
      <p className="sub">
        Signed in as <strong>{ent.email}</strong> ·{" "}
        {ent.isPremium ? "✦ Premium" : "Free plan"}
      </p>

      {attempted > 0 && (
        <p className="sub">
          📈 You&apos;ve mastered <strong>{mastered}</strong>{" "}
          {mastered === 1 ? "topic" : "topics"} and attempted {attempted} so far. Keep the streak
          going!
        </p>
      )}

      {searchParams.status === "success" && (
        <p className="msg good">🎉 Payment received — your Premium access is active!</p>
      )}
      {searchParams.status === "cancel" && (
        <p className="msg">Checkout cancelled — no charge was made.</p>
      )}

      {ent.isPremium ? (
        <>
          <p>You have full access to every topic. Nice one.</p>
          <div className="actions">
            <Link href="/learn" className="btn primary">
              Start revising →
            </Link>
            <AccountActions mode="portal" />
            <AccountActions mode="signout" />
          </div>
        </>
      ) : (
        <>
          {searchParams.upgrade === "1" && (
            <p className="msg">That topic is Premium — unlock everything below.</p>
          )}
          <h2 style={{ fontSize: 18, marginTop: 18 }}>Start your 7-day free trial ✦</h2>
          <ul className="perks">
            <li>All topics &amp; every question</li>
            <li>Concept explainers, deeper dives and analogies</li>
            <li>Unlimited 50/50 lifelines</li>
            <li>7 days free, then cancel anytime</li>
          </ul>
          <UpgradeButtons />
          <div className="actions">
            <AccountActions mode="signout" />
          </div>
        </>
      )}
    </main>
  );
}
