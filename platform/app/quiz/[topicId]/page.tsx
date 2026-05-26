import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTopic } from "@/lib/content";
import { getEntitlement } from "@/lib/entitlement";
import { getQuestions } from "@/lib/questions";
import Quiz from "@/components/Quiz";

// Server Component. This is the real security boundary: a premium topic's questions
// are only fetched and sent to the browser AFTER the entitlement check passes.
// A non-subscriber never receives the premium question data.
export default async function QuizPage({
  params,
}: {
  params: { topicId: string };
}) {
  const topic = getTopic(params.topicId);
  if (!topic) notFound();

  if (!topic.free) {
    const ent = await getEntitlement();
    if (!ent.isPremium) {
      redirect("/account?upgrade=1");
    }
  }

  const questions = await getQuestions(topic, { limit: 8 });

  return (
    <main className="card">
      <div style={{ marginBottom: 12 }}>
        <Link href="/learn" className="btn">
          ← Topics
        </Link>
      </div>
      <Quiz topic={{ ...topic, questions }} />
    </main>
  );
}
