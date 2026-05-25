import Link from "next/link";
import { LEVELS, topicsByLevel } from "@/lib/content";
import { getEntitlement } from "@/lib/entitlement";
import { getProgressMap } from "@/lib/progress";
import { mockExamId } from "@/lib/exam";

// The app itself: topics grouped by level (GCSE / A-Level). Premium topics are
// locked based on the server-verified entitlement.
export default async function Learn() {
  const [ent, progress] = await Promise.all([getEntitlement(), getProgressMap()]);

  return (
    <main>
      {LEVELS.map((lvl) => {
        const topics = topicsByLevel(lvl.id);
        const examProg = progress[mockExamId(lvl.id)];
        return (
          <section className="card" key={lvl.id} style={{ marginBottom: 16 }}>
            <h1>
              {lvl.label} Maths{" "}
              <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>
                · {lvl.hint}
              </span>
            </h1>
            <p className="sub">
              Bite-size questions with a concept, a deeper dive and an analogy on every answer.
            </p>
            <div className="grid">
              {topics.map((topic) => {
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
                      "topic" +
                      (locked ? " locked" : "") +
                      (!locked && prog?.completed ? " mastered" : "")
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

            <Link
              href={ent.isPremium ? `/exam?level=${lvl.id}` : "/account?upgrade=1"}
              className="examCard"
            >
              <span className="examIco">📝</span>
              <span className="examBody">
                <span className="examTitle">{lvl.label} Mock Exam {!ent.isPremium && "🔒"}</span>
                <span className="examMeta">
                  {!ent.isPremium
                    ? "Premium · 12 mixed questions"
                    : examProg
                      ? `Best ${examProg.best_score}/${examProg.total} · 12 mixed questions`
                      : `12 mixed ${lvl.label} questions`}
                </span>
              </span>
              <span className="examGo">{ent.isPremium ? "Start →" : "Unlock →"}</span>
            </Link>
          </section>
        );
      })}

      {!ent.isPremium && (
        <div className="actions">
          <Link href="/account?upgrade=1" className="btn primary">
            Unlock everything — 7-day free trial →
          </Link>
        </div>
      )}
    </main>
  );
}
