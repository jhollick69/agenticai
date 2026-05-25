"use client";

import { useEffect, useMemo, useState } from "react";
import type { Topic } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";

type Shuffled = { text: string; isCorrect: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let n = a.length - 1; n > 0; n--) {
    const r = Math.floor(Math.random() * (n + 1));
    [a[n], a[r]] = [a[r], a[n]];
  }
  return a;
}

// Deterministic shuffle so the server and client render the same option order
// (no hydration mismatch). The seed changes per question and per attempt, so it
// still feels random and reshuffles on "try again".
function seedFrom(topicId: string, qi: number, epoch: number): number {
  let h = 2166136261;
  const str = `${topicId}:${qi}:${epoch}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let n = a.length - 1; n > 0; n--) {
    const r = Math.floor(rand() * (n + 1));
    [a[n], a[r]] = [a[r], a[n]];
  }
  return a;
}

// Rough, clearly-labelled GCSE grade estimate from a percentage. Real boundaries
// vary by exam board, tier and year — this is only an indicator.
function estimateGrade(pct: number): number {
  const bands = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
  for (let i = 0; i < bands.length; i++) {
    if (pct >= bands[i]) return 9 - i;
  }
  return 1;
}

function gradeMessage(grade: number): string {
  if (grade >= 7) return "Excellent — that's a strong pass.";
  if (grade >= 4) return "Nice work — that's around a standard pass.";
  return "Keep practising and run another paper — you'll climb fast.";
}

export default function Quiz({
  topic,
  examMode = false,
  newPaperHref,
}: {
  topic: Topic;
  examMode?: boolean;
  newPaperHref?: string;
}) {
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [usedFifty, setUsedFifty] = useState(false);
  const [dimmed, setDimmed] = useState<number[]>([]);
  const [showAnalogy, setShowAnalogy] = useState(false);
  const [showDeeper, setShowDeeper] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");
  const [epoch, setEpoch] = useState(0);

  // When a topic is finished, save the result for signed-in users (keeping their
  // best score). Signed-out players simply aren't saved — no error, no nag.
  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setSaved("saving");
        const total = topic.questions.length;
        const { data: existing } = await supabase
          .from("progress")
          .select("best_score, attempts")
          .eq("user_id", user.id)
          .eq("topic_id", topic.id)
          .maybeSingle();
        const best = Math.max(existing?.best_score ?? 0, score);
        await supabase.from("progress").upsert(
          {
            user_id: user.id,
            topic_id: topic.id,
            best_score: best,
            last_score: score,
            total,
            attempts: (existing?.attempts ?? 0) + 1,
            completed: best >= total,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,topic_id" },
        );
        if (!cancelled) setSaved("done");
      } catch {
        if (!cancelled) setSaved("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [done, score, topic.id, topic.questions.length]);

  const q = topic.questions[qi];

  // Reshuffle options whenever the question changes.
  const options: Shuffled[] = useMemo(
    () =>
      seededShuffle(
        q.options.map((text, i) => ({ text, isCorrect: i === q.correct })),
        seedFrom(topic.id, qi, epoch),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qi, topic.id, epoch],
  );
  const correctIndex = options.findIndex((o) => o.isCorrect);

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    setAnswered(true);
    if (options[i].isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function useFifty() {
    if (answered || usedFifty) return;
    setUsedFifty(true);
    const wrong = shuffle(options.map((_, i) => i).filter((i) => i !== correctIndex));
    setDimmed(wrong.slice(1));
  }

  function next() {
    if (qi + 1 < topic.questions.length) {
      setQi(qi + 1);
      setAnswered(false);
      setPicked(null);
      setUsedFifty(false);
      setDimmed([]);
      setShowAnalogy(false);
      setShowDeeper(false);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setQi(0);
    setAnswered(false);
    setPicked(null);
    setUsedFifty(false);
    setDimmed([]);
    setShowAnalogy(false);
    setShowDeeper(false);
    setScore(0);
    setStreak(0);
    setDone(false);
    setSaved("idle");
    setEpoch((e) => e + 1);
  }

  if (done) {
    const total = topic.questions.length;
    const pct = total ? score / total : 0;
    const topicMsg =
      pct === 1
        ? "Perfect! You've nailed this topic. 🌟"
        : pct >= 0.75
          ? "Great work — nearly there. Run it again to lock it in."
          : pct >= 0.5
            ? "Good effort! Review the concepts and try again."
            : "Tricky one — read the analogies and have another go. You've got this.";
    const grade = estimateGrade(pct);
    return (
      <div style={{ textAlign: "center" }}>
        <h1>{examMode ? "Paper complete! 📝" : "Topic complete! 🎉"}</h1>
        <div style={{ fontSize: 46, fontWeight: 900, color: "var(--good)", margin: "8px 0" }}>
          {score} / {total}
          {examMode ? " marks" : ""}
        </div>
        {examMode ? (
          <>
            <div className="gradePill">≈ Grade {grade}</div>
            <p className="sub">
              {Math.round(pct * 100)}% · {gradeMessage(grade)}
            </p>
            <p className="note">
              Rough guide only — real grade boundaries vary by exam board, tier and year.
            </p>
          </>
        ) : (
          <p className="sub">{topicMsg}</p>
        )}
        {saved === "done" && <p className="msg good">✓ Progress saved</p>}
        <div className="actions" style={{ justifyContent: "center" }}>
          {examMode && newPaperHref ? (
            <>
              <a className="btn primary" href={newPaperHref}>
                ↻ New paper
              </a>
              <button className="btn" onClick={restart}>
                Review this paper
              </button>
            </>
          ) : (
            <button className="btn" onClick={restart}>
              ↻ Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="sub">
        {topic.icon} {topic.name} · Q{qi + 1} of {topic.questions.length} · ⭐ {score} · 🔥 {streak}
      </p>
      <div style={{ fontSize: 19, fontWeight: 700, margin: "4px 0 18px" }}>{q.q}</div>

      <div style={{ display: "grid", gap: 10 }}>
        {options.map((o, i) => {
          const isCorrect = answered && i === correctIndex;
          const isWrong = answered && i === picked && i !== correctIndex;
          const border = isCorrect
            ? "var(--good)"
            : isWrong
              ? "var(--bad)"
              : "var(--line)";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered || dimmed.includes(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--panel2)",
                border: `2px solid ${border}`,
                color: "var(--ink)",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 16,
                textAlign: "left",
                cursor: answered ? "default" : "pointer",
                opacity: dimmed.includes(i) ? 0.28 : 1,
              }}
            >
              <span
                style={{
                  flex: "0 0 28px",
                  height: 28,
                  borderRadius: 9,
                  background: "var(--slot)",
                  border: "1px solid var(--line)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "var(--accent)",
                }}
              >
                {"ABCD"[i]}
              </span>
              {o.text}
            </button>
          );
        })}
      </div>

      <div className="actions">
        <button className="btn" onClick={useFifty} disabled={answered || usedFifty}>
          ⚖️ 50/50
        </button>
        <button className="btn" onClick={() => setShowAnalogy((s) => !s)}>
          🤔 Confused?
        </button>
      </div>

      {showAnalogy && (
        <div
          className="card"
          style={{ marginTop: 14, background: "rgba(251,191,36,.12)", borderColor: "rgba(251,191,36,.45)" }}
        >
          <strong style={{ color: "var(--warn)" }}>🤔 Simple analogy</strong>
          <p style={{ margin: "6px 0 0" }}>{q.analogy}</p>
        </div>
      )}

      {answered && (
        <>
          <p className={"msg " + (picked === correctIndex ? "good" : "bad")}>
            {picked === correctIndex
              ? `✅ Correct!  🔥 streak ×${streak}`
              : `❌ Not quite — the answer was ${q.options[q.correct]}.`}
          </p>
          <div
            className="card"
            style={{ marginTop: 8, background: "rgba(167,139,250,.12)", borderColor: "rgba(167,139,250,.4)" }}
          >
            <strong style={{ color: "var(--accent)" }}>💡 The concept</strong>
            <p style={{ margin: "6px 0 0" }}>{q.concept}</p>
          </div>
          {showDeeper && (
            <div
              className="card"
              style={{ marginTop: 8, background: "rgba(244,114,182,.12)", borderColor: "rgba(244,114,182,.4)" }}
            >
              <strong style={{ color: "var(--accent2)" }}>🔍 Deeper dive</strong>
              <p style={{ margin: "6px 0 0" }}>{q.deeper}</p>
            </div>
          )}
          <div className="actions">
            {!showDeeper && (
              <button className="btn" onClick={() => setShowDeeper(true)}>
                🔍 Deeper dive
              </button>
            )}
            <button className="btn primary" onClick={next}>
              {qi + 1 < topic.questions.length ? "Next →" : "Finish →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
