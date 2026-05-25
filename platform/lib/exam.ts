import { topicsByLevel, type Level, type Question, type Topic } from "@/lib/content";

export function mockExamId(level: Level): string {
  return `mock-exam-${level}`;
}

// Builds a mixed "mock exam" by sampling questions from across every topic in the
// given level. Returned as a Topic so it plays with the existing <Quiz> component.
// Sampled server-side per request, so each sitting is a fresh mix.
export function buildMockExam(level: Level, count = 12): Topic {
  const pool: Question[] = topicsByLevel(level).flatMap((t) => t.questions);
  const a = [...pool];
  for (let n = a.length - 1; n > 0; n--) {
    const r = Math.floor(Math.random() * (n + 1));
    [a[n], a[r]] = [a[r], a[n]];
  }
  return {
    id: mockExamId(level),
    icon: "📝",
    name: level === "alevel" ? "A-Level Mock Exam" : "GCSE Mock Exam",
    free: false,
    level,
    questions: a.slice(0, Math.min(count, a.length)),
  };
}
