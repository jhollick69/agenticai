"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Email + password sign-in / sign-up via Supabase Auth.
// (Magic-link / OAuth are easy alternatives — see supabase.auth.signInWithOtp / signInWithOAuth.)
export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ text: "Check your email to confirm your account, then sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh();
      }
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Something went wrong.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        minLength={6}
        required
      />
      {msg && <p className={"msg " + (msg.bad ? "bad" : "good")}>{msg.text}</p>}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "…" : mode === "signup" ? "Create account →" : "Sign in →"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setMsg(null);
          }}
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
        </button>
      </div>
    </form>
  );
}
