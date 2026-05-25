import { TOPICS, type Question, type Topic } from "@/lib/content";

export const MOCK_EXAM_ID = "mock-exam";

// Builds a mixed "mock exam" by sampling questions from across every topic.
// Returned as a Topic so it can be played with the existing <Quiz> component.
// Sampled server-side per request, so each sitting is a fresh mix.
export function buildMockExam(count = 12): Topic {
  const pool: Question[] = TOPICS.flatMap((t) => t.questions);
  const a = [...pool];
  for (let n = a.length - 1; n > 0; n--) {
    const r = Math.floor(Math.random() * (n + 1));
    [a[n], a[r]] = [a[r], a[n]];
  }
  return {
    id: MOCK_EXAM_ID,
    icon: "📝",
    name: "Mock Exam",
    free: false,
    questions: a.slice(0, Math.min(count, a.length)),
  };
}
