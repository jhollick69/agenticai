import Link from "next/link";
import { TOPICS } from "@/lib/content";
import { getEntitlement } from "@/lib/entitlement";
import { getProgressMap } from "@/lib/progress";

// The app itself: the topic grid. Premium topics are locked based on the
// server-verified entitlement.
export default async function Learn() {
  const [ent, progress] = await Promise.all([getEntitlement(), getProgressMap()]);

  return (
    <main className="card">
      <h1>Pick a topic 🚀</h1>
      <p className="sub">
        Fun, bite-size questions with a concept explainer, a deeper dive and a plain-English
        analogy on every answer. Fractions, Percentages and Ratio are free —{" "}
        {ent.isPremium ? "and you've unlocked the rest. Nice one." : "go Premium to unlock the rest."}
      </p>
      <div className="grid">
        {TOPICS.map((topic) => {
          const locked = !topic.free && !ent.isPremium;
          const href = locked ? "/account?upgrade=1" : `/quiz/${topic.id}`;
          const prog = progress[topic.id];
          let meta = `${topic.questions.length} questions`;
          if (locked) meta = "🔒 Premium";
          else if (prog?.completed) meta = `★ ${prog.best_score}/${prog.total}`;
          else if (prog) meta = `Best ${prog.best_score}/${prog.total}`;
          return (
            <Link
              key={topic.id}
              href={href}
              className={
                "topic" + (locked ? " locked" : "") + (!locked && prog?.completed ? " mastered" : "")
              }
            >
              {locked && <span className="lock">🔒</span>}
              {!locked && prog?.completed && <span className="lock">★</span>}
              <span className="ico">{topic.icon}</span>
              <span className="name">{topic.name}</span>
              <span className={"meta" + (!locked && prog ? " has" : "")}>{meta}</span>
            </Link>
          );
        })}
      </div>
      {!ent.isPremium && (
        <div className="actions">
          <Link href="/account?upgrade=1" className="btn primary">
            Unlock all topics — 7-day free trial →
          </Link>
        </div>
      )}
    </main>
  );
}
