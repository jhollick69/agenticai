"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Two small client actions: open the Stripe billing portal, or sign out.
export default function AccountActions({ mode }: { mode: "portal" | "signout" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.refresh();
  }

  async function openPortal() {
    setBusy(true);
    const res = await fetch("/api/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setBusy(false);
    }
  }

  if (mode === "signout") {
    return (
      <button className="btn" onClick={signOut} disabled={busy}>
        Sign out
      </button>
    );
  }
  return (
    <button className="btn" onClick={openPortal} disabled={busy}>
      {busy ? "…" : "Manage billing"}
    </button>
  );
}
