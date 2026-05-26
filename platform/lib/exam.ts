import { topicsByLevel, type Level, type Question, type Topic } from "@/lib/content";
import { getQuestions } from "@/lib/questions";

export function mockExamId(level: Level): string {
  return `mock-exam-${level}`;
}

// Builds a mixed "mock exam" by sampling across every topic in the level, drawing
// from the same source as topic quizzes (DB/built-in curated questions plus
// generated ones), so each sitting is a fresh mix.
export async function buildMockExam(level: Level, count = 12): Promise<Topic> {
  const topics = topicsByLevel(level);
  const perTopic = await Promise.all(topics.map((t) => getQuestions(t)));
  const pool: Question[] = perTopic.flat();
  for (let n = pool.length - 1; n > 0; n--) {
    const r = Math.floor(Math.random() * (n + 1));
    [pool[n], pool[r]] = [pool[r], pool[n]];
  }
  return {
    id: mockExamId(level),
    icon: "📝",
    name: level === "alevel" ? "A-Level Mock Exam" : "GCSE Mock Exam",
    free: false,
    level,
    questions: pool.slice(0, Math.min(count, pool.length)),
  };
}
