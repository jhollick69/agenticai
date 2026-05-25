"use client";

import { useState } from "react";

// Kicks off Stripe Checkout for the chosen plan. The /api/checkout route creates the
// session server-side; we just redirect the browser to the returned Checkout URL.
export default function UpgradeButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: "monthly" | "annual") {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="plans">
        <button className="plan" onClick={() => checkout("monthly")} disabled={!!busy}>
          <div className="price">£4.99</div>
          <div className="per">{busy === "monthly" ? "Redirecting…" : "per month"}</div>
        </button>
        <button className="plan" onClick={() => checkout("annual")} disabled={!!busy}>
          <div className="price">£39</div>
          <div className="per">{busy === "annual" ? "Redirecting…" : "per year · save 35%"}</div>
        </button>
      </div>
      {error && <p className="msg bad">{error}</p>}
    </div>
  );
}
