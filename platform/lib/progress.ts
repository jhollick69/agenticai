import { createClient } from "@/lib/supabase/server";

export type TopicProgress = {
  best_score: number;
  total: number;
  completed: boolean;
};

// Reads the signed-in user's per-topic progress as a map keyed by topic id.
// Returns {} for signed-out visitors.
export async function getProgressMap(): Promise<Record<string, TopicProgress>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("progress")
    .select("topic_id, best_score, total, completed")
    .eq("user_id", user.id);

  const map: Record<string, TopicProgress> = {};
  for (const row of data ?? []) {
    map[row.topic_id as string] = {
      best_score: row.best_score as number,
      total: row.total as number,
      completed: row.completed as boolean,
    };
  }
  return map;
}
