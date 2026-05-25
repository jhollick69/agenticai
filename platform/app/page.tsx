import Link from "next/link";
import { TOPICS } from "@/lib/content";
import { getEntitlement } from "@/lib/entitlement";

// Home page (Server Component). Renders the topic grid and locks premium topics
// based on the server-verified entitlement.
export default async function Home() {
  const ent = await getEntitlement();

  return (
    <main className="card">
      <h1>Pick a topic 🚀</h1>
      <p className="sub">
        Fun, bite-size questions with a concept explainer, a deeper dive and a plain-English
        analogy on every answer. Fractions, Percentages and Ratio are free — go Premium to unlock
        the rest.
      </p>
      <div className="grid">
        {TOPICS.map((topic) => {
          const locked = !topic.free && !ent.isPremium;
          const href = locked ? "/account?upgrade=1" : `/quiz/${topic.id}`;
          return (
            <Link
              key={topic.id}
              href={href}
              className={"topic" + (locked ? " locked" : "")}
            >
              {locked && <span className="lock">🔒</span>}
              <span className="ico">{topic.icon}</span>
              <span className="name">{topic.name}</span>
              <span className="meta">
                {locked ? "🔒 Premium" : `${topic.questions.length} questions`}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
