import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getEntitlement } from "@/lib/entitlement";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TOPICS } from "@/lib/content";

export const metadata = { title: "Admin" };

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { done?: string };
}) {
  const ent = await getEntitlement();
  const isAdmin = !!(ent.email && adminEmails().includes(ent.email.toLowerCase()));

  if (!isAdmin) {
    return (
      <main className="card">
        <h1>Admin</h1>
        <p className="sub">
          This area is restricted. Sign in with an email listed in the <code>ADMIN_EMAILS</code>{" "}
          environment variable.
        </p>
      </main>
    );
  }

  let count: number | null = null;
  try {
    const { count: c } = await supabaseAdmin()
      .from("questions")
      .select("*", { count: "exact", head: true });
    count = c ?? 0;
  } catch {
    count = null;
  }

  async function seedBuiltin() {
    "use server";
    const admin = supabaseAdmin();
    await admin.from("questions").delete().eq("source", "builtin");
    const rows = TOPICS.flatMap((t) =>
      t.questions.map((q) => ({
        topic_id: t.id,
        level: t.level ?? "gcse",
        q: q.q,
        options: q.options,
        correct: q.correct,
        concept: q.concept,
        deeper: q.deeper,
        analogy: q.analogy,
        source: "builtin",
        active: true,
      })),
    );
    await admin.from("questions").insert(rows);
    revalidatePath("/admin");
    redirect("/admin?done=seed");
  }

  async function addQuestion(formData: FormData) {
    "use server";
    const val = (k: string) => String(formData.get(k) ?? "").trim();
    const options = [val("o1"), val("o2"), val("o3"), val("o4")].filter(Boolean);
    const correct = Math.max(0, Math.min(options.length - 1, (parseInt(val("correct"), 10) || 1) - 1));
    const topicId = val("topic");
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!val("q") || options.length < 2 || !topic) {
      redirect("/admin?done=err");
    }
    await supabaseAdmin()
      .from("questions")
      .insert({
        topic_id: topicId,
        level: topic?.level ?? "gcse",
        q: val("q"),
        options,
        correct,
        concept: val("concept"),
        deeper: val("deeper"),
        analogy: val("analogy"),
        source: "manual",
        active: true,
      });
    revalidatePath("/admin");
    redirect("/admin?done=add");
  }

  return (
    <main className="card">
      <h1>Admin · questions</h1>
      <p className="sub">
        Signed in as <strong>{ent.email}</strong>.{" "}
        {count === null
          ? "Couldn't reach the questions table — run schema.sql first."
          : `${count} question(s) currently in the database.`}
      </p>

      {searchParams.done === "seed" && <p className="msg good">✓ Imported the built-in question bank.</p>}
      {searchParams.done === "add" && <p className="msg good">✓ Question added.</p>}
      {searchParams.done === "err" && <p className="msg bad">Please fill in the question and at least two options.</p>}

      <form action={seedBuiltin} style={{ marginBottom: 22 }}>
        <button className="btn" type="submit">
          ⟳ Import built-in questions ({TOPICS.reduce((n, t) => n + t.questions.length, 0)})
        </button>
        <p className="note">
          Replaces previously imported built-in questions; your manually added ones are kept.
        </p>
      </form>

      <h2 style={{ fontSize: 18 }}>Add a question</h2>
      <form action={addQuestion}>
        <label htmlFor="topic">Topic</label>
        <select id="topic" name="topic" required>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.level ?? "gcse"})
            </option>
          ))}
        </select>
        <label htmlFor="q">Question</label>
        <textarea id="q" name="q" required />
        <label>Options (mark the correct one below)</label>
        <input type="text" name="o1" placeholder="Option 1" />
        <input type="text" name="o2" placeholder="Option 2" />
        <input type="text" name="o3" placeholder="Option 3" />
        <input type="text" name="o4" placeholder="Option 4" />
        <label htmlFor="correct">Correct option number (1–4)</label>
        <input type="text" name="correct" id="correct" placeholder="1" defaultValue="1" />
        <label htmlFor="concept">Concept</label>
        <textarea id="concept" name="concept" />
        <label htmlFor="deeper">Deeper dive</label>
        <textarea id="deeper" name="deeper" />
        <label htmlFor="analogy">Analogy</label>
        <textarea id="analogy" name="analogy" />
        <div className="actions">
          <button className="btn primary" type="submit">
            Add question →
          </button>
        </div>
      </form>
    </main>
  );
}
