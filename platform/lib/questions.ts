import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Question, Topic } from "@/lib/content";
import { generateFor, hasGenerator } from "@/lib/generators";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let n = a.length - 1; n > 0; n--) {
    const r = Math.floor(Math.random() * (n + 1));
    [a[n], a[r]] = [a[r], a[n]];
  }
  return a;
}

// Read curated questions for a topic from the database (service role, server-only).
// Returns null if the DB is unavailable or has no rows, so callers fall back to the
// built-in bank — meaning the app works with zero setup and improves once seeded.
async function curatedFromDb(topicId: string): Promise<Question[] | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("questions")
      .select("q, options, correct, concept, deeper, analogy")
      .eq("topic_id", topicId)
      .eq("active", true);
    if (error || !data || data.length === 0) return null;
    const rows = data
      .map((r: Record<string, unknown>) => ({
        q: String(r.q ?? ""),
        options: Array.isArray(r.options) ? (r.options as string[]) : [],
        correct: typeof r.correct === "number" ? r.correct : 0,
        concept: String(r.concept ?? ""),
        deeper: String(r.deeper ?? ""),
        analogy: String(r.analogy ?? ""),
      }))
      .filter((q) => q.q && q.options.length >= 2);
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

// The single entry point for "give me this topic's questions". Combines curated
// questions (DB if available, else the built-in bank) with freshly generated ones,
// shuffled so every sitting feels different.
export async function getQuestions(
  topic: Topic,
  opts?: { generated?: number; limit?: number },
): Promise<Question[]> {
  const curated = (await curatedFromDb(topic.id)) ?? topic.questions;
  const genN = opts?.generated ?? (hasGenerator(topic.id) ? 3 : 0);
  const generated = generateFor(topic.id, genN);
  const pool = shuffle([...curated, ...generated]);
  return opts?.limit ? pool.slice(0, opts.limit) : pool;
}
