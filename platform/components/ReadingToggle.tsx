"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Toggles a dyslexia-friendly reading theme. Stores the choice in a cookie so the
// root layout can apply it server-side (no flash), then refreshes to re-render.
export default function ReadingToggle() {
  const router = useRouter();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(document.cookie.split("; ").includes("reading=dyslexia"));
  }, []);

  function toggle() {
    const next = !on;
    document.cookie = `reading=${next ? "dyslexia" : "default"}; path=/; max-age=31536000; samesite=lax`;
    setOn(next);
    router.refresh();
  }

  return (
    <button
      className="btn"
      onClick={toggle}
      aria-pressed={on}
      title="Dyslexia-friendly reading mode"
      style={{ fontWeight: 800 }}
    >
      Aa{on ? " ✓" : ""}
    </button>
  );
}
