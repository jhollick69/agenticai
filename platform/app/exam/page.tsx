import { redirect } from "next/navigation";
import Link from "next/link";
import { getEntitlement } from "@/lib/entitlement";
import { buildMockExam } from "@/lib/exam";
import Quiz from "@/components/Quiz";

// Premium-only mixed practice paper. Like premium topics, entitlement is checked
// on the server before any questions are sent to the browser.
export default async function ExamPage() {
  const ent = await getEntitlement();
  if (!ent.isPremium) {
    redirect("/account?upgrade=1");
  }

  const exam = buildMockExam(12);

  return (
    <main className="card">
      <div style={{ marginBottom: 12 }}>
        <Link href="/learn" className="btn">
          ← Topics
        </Link>
      </div>
      <Quiz topic={exam} />
    </main>
  );
}
