"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Users land here from the password-reset email. The Supabase browser client
// automatically picks up the recovery session from the link, so updateUser() can
// set the new password.
export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk(true);
      setMsg({ text: "Password updated. You're all set." });
      router.refresh();
    } catch {
      setMsg({
        text: "Couldn't update the password. Please open the most recent reset link from your email and try again.",
        bad: true,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>Choose a new password</h1>
      {ok ? (
        <>
          <p className="msg good">{msg?.text}</p>
          <div className="actions">
            <Link href="/account" className="btn primary">
              Go to your account →
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="sub">Enter a new password for your account.</p>
          <form onSubmit={submit}>
            <label htmlFor="newpw">New password</label>
            <input
              id="newpw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
            {msg && <p className={"msg " + (msg.bad ? "bad" : "good")}>{msg.text}</p>}
            <div className="actions">
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? "…" : "Update password →"}
              </button>
              <Link href="/account" className="btn">
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
