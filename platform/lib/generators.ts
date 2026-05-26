import type { Question } from "@/lib/content";

// Procedural question generators. Each returns a fresh Question with randomised
// numbers, the correct answer first (correct: 0; the Quiz shuffles options), and
// three plausible distractors. These make calculation topics endlessly fresh.

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build 4 unique options (correct first) from a correct value + candidate distractors,
// padding with nearby numbers if any candidates clash.
function numOptions(
  correct: number,
  distractors: number[],
  unit = "",
): { options: string[]; correct: number } {
  const fmt = (n: number) => (unit ? `${n} ${unit}` : `${n}`);
  const seen = new Set<number>([correct]);
  const vals: number[] = [correct];
  for (const d of distractors) {
    if (vals.length >= 4) break;
    if (Number.isFinite(d) && d >= 0 && !seen.has(d)) {
      seen.add(d);
      vals.push(d);
    }
  }
  let k = correct + 1;
  while (vals.length < 4) {
    if (!seen.has(k)) {
      seen.add(k);
      vals.push(k);
    }
    k++;
  }
  return { options: vals.map(fmt), correct: 0 };
}

const SUP: Record<number, string> = { 2: "²", 3: "³" };
const ORDINAL: Record<number, string> = { 2: "half", 3: "third", 4: "quarter", 5: "fifth" };

function genPercentage(): Question {
  const P = pick([5, 10, 15, 20, 25, 30, 40, 50, 75]);
  const N = pick([20, 40, 60, 80, 100, 120, 160, 200, 240, 300]);
  const ans = (N * P) / 100;
  const { options, correct } = numOptions(ans, [(N * P) / 10, N - ans, P, ans * 2]);
  return {
    q: `What is ${P}% of ${N}?`,
    options,
    correct,
    concept: "A percentage is a fraction out of 100 — divide by 100, then multiply by the percent.",
    deeper: `${P}% of ${N} = ${N} ÷ 100 × ${P} = ${ans}. A quick route: 10% of ${N} is ${N / 10}, then scale up to ${P}%.`,
    analogy: `Percent means 'per 100'. Picture ${N} split into 100 equal bits and take ${P} of them.`,
  };
}

function genLinear(): Question {
  const a = randInt(2, 6);
  const x = randInt(2, 9);
  const b = randInt(1, 9);
  const c = a * x + b;
  const { options, correct } = numOptions(x, [c - b, x + 1, Math.max(1, x - 1), c]);
  return {
    q: `Solve ${a}x + ${b} = ${c}. What is x?`,
    options,
    correct,
    concept: "Undo the operations in reverse: subtract first, then divide.",
    deeper: `${a}x + ${b} = ${c} → subtract ${b}: ${a}x = ${c - b} → divide by ${a}: x = ${x}. Check: ${a}×${x} + ${b} = ${c} ✓.`,
    analogy: `An equation is a balanced see-saw — peel off the +${b}, then the ×${a}, to leave x on its own.`,
  };
}

function genFraction(): Question {
  const den = pick([2, 3, 4, 5]);
  const num = randInt(1, den - 1);
  const k = randInt(2, 12);
  const N = den * k;
  const ans = num * k;
  const { options, correct } = numOptions(ans, [k, num * den, N - ans, ans + k]);
  return {
    q: `What is ${num}/${den} of ${N}?`,
    options,
    correct,
    concept: "To find a fraction of a number: divide by the bottom, then multiply by the top.",
    deeper: `${N} ÷ ${den} = ${k} (that's one ${ORDINAL[den]}), then × ${num} = ${ans}.`,
    analogy: `Share ${N} into ${den} equal piles (${k} each) and take ${num} of them.`,
  };
}

function genArea(): Question {
  const w = randInt(3, 12);
  const h = randInt(2, 11);
  const area = w * h;
  const { options, correct } = numOptions(area, [2 * (w + h), w + h, area + w], "cm²");
  return {
    q: `A rectangle is ${w} cm by ${h} cm. What is its area?`,
    options,
    correct,
    concept: "Area of a rectangle = length × width, measured in square units (cm²).",
    deeper: `${w} × ${h} = ${area} cm². (Its perimeter would instead be 2 × (${w} + ${h}) = ${2 * (w + h)} cm.)`,
    analogy: `Tile it with 1 cm squares: ${w} across and ${h} down makes ${area} tiles.`,
  };
}

function genPower(): Question {
  const b = randInt(2, 6);
  const e = pick([2, 3]);
  const val = b ** e;
  const { options, correct } = numOptions(val, [b * e, val - b, (b + 1) ** e]);
  return {
    q: `What is ${b}${SUP[e]}?`,
    options,
    correct,
    concept: "A power tells you how many times to multiply the base by itself.",
    deeper: `${b}${SUP[e]} = ${Array(e).fill(b).join(" × ")} = ${val} — not ${b} × ${e}.`,
    analogy: "It's repeated multiplication, not multiplying the base by the little number.",
  };
}

function genGradient(): Question {
  const a = randInt(2, 6);
  const k = randInt(2, 7);
  const ans = 2 * a * k;
  const { options, correct } = numOptions(ans, [a * k * k, 2 * a, a * k]);
  return {
    q: `Find the gradient of y = ${a}x² at the point where x = ${k}.`,
    options,
    correct,
    concept: "Differentiate to get the gradient function, then substitute the x-value.",
    deeper: `dy/dx = ${2 * a}x. At x = ${k}, gradient = ${2 * a} × ${k} = ${ans}. (The value ${a * k * k} is the height y, not the slope.)`,
    analogy: "The derivative is a slope formula — plug in the x you care about to read off the steepness.",
  };
}

export const GENERATORS: Record<string, () => Question> = {
  percentages: genPercentage,
  algebra: genLinear,
  fractions: genFraction,
  area: genArea,
  indices: genPower,
  differentiation: genGradient,
};

export function hasGenerator(topicId: string): boolean {
  return topicId in GENERATORS;
}

// Produce up to n distinct generated questions for a topic (by question text).
export function generateFor(topicId: string, n: number): Question[] {
  const gen = GENERATORS[topicId];
  if (!gen || n <= 0) return [];
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < n && guard < n * 10) {
    guard++;
    const q = gen();
    if (!seen.has(q.q)) {
      seen.add(q.q);
      out.push(q);
    }
  }
  return out;
}
