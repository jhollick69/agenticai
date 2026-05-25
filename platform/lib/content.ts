// Quiz content. `free` topics are public; the rest require an active subscription.
//
// NOTE: this is a representative subset (2 questions per topic) to keep the scaffold
// focused on the paywall plumbing. The full 70-question bank lives in the prototype
// (../index.html, the `CONTENT` array). For production you'd migrate this into the
// database (a `questions` table) so content is editable without a redeploy and so
// premium questions are fetched per-request behind the entitlement check.

export type Question = {
  q: string;
  options: string[];
  correct: number; // index of the correct option (shuffled at render time)
  concept: string;
  deeper: string;
  analogy: string;
};

export type Topic = {
  id: string;
  icon: string;
  name: string;
  free: boolean;
  questions: Question[];
};

export const TOPICS: Topic[] = [
  {
    id: "fractions",
    icon: "🍕",
    name: "Fractions",
    free: true,
    questions: [
      {
        q: "You eat 3/8 of a pizza and your mate eats 2/8. How much pizza is gone?",
        options: ["5/8", "5/16", "1/8", "6/8"],
        correct: 0,
        concept:
          "To add fractions with the same denominator, add the tops and keep the bottom the same.",
        deeper:
          "The denominator counts how many equal slices the whole is cut into; it doesn't change when you combine same-size pieces. 3 eighths + 2 eighths = 5 eighths.",
        analogy:
          "Slices are slices. Eat 3 then 2 of a pizza cut into 8 and that's 5 slices gone — you don't recount how many slices it was cut into.",
      },
      {
        q: "What is 2/3 of 18?",
        options: ["12", "6", "9", "27"],
        correct: 0,
        concept:
          "To find a fraction of a number: divide by the bottom, then multiply by the top.",
        deeper: "18 ÷ 3 = 6 (one third), then × 2 = 12. In general a/b of N = (N ÷ b) × a.",
        analogy: "18 sweets in 3 equal piles (6 each); grab two piles = 12.",
      },
    ],
  },
  {
    id: "percentages",
    icon: "💯",
    name: "Percentages",
    free: true,
    questions: [
      {
        q: "A £40 hoodie has 25% off. How much money do you save?",
        options: ["£10", "£15", "£30", "£25"],
        correct: 0,
        concept: "A percentage is a fraction out of 100. 'Per cent' means 'per hundred'.",
        deeper: "25% = 1/4, so 25% of £40 = £40 ÷ 4 = £10. The sale price would be £30.",
        analogy:
          "25% means '£25 saved for every £100'. £40 is 0.4 of £100, so you save 0.4 × £25 = £10.",
      },
      {
        q: "What is 10% of 250?",
        options: ["25", "2.5", "250", "50"],
        correct: 0,
        concept: "Finding 10% is easy — divide by 10.",
        deeper: "10% = 1/10, so 250 ÷ 10 = 25. From 10% you can build others: 5% = 12.5, 20% = 50.",
        analogy: "Slice into 10 equal bits and take one: 250 → 25 in each pile.",
      },
    ],
  },
  {
    id: "ratio",
    icon: "⚖️",
    name: "Ratio",
    free: true,
    questions: [
      {
        q: "Share £60 in the ratio 2:3. How much is the bigger share?",
        options: ["£36", "£24", "£30", "£40"],
        correct: 0,
        concept: "Add the parts to find total shares, find one share, then scale up.",
        deeper: "2:3 → 5 parts. £60 ÷ 5 = £12 per part. Shares are £24 and £36 (sum £60 ✓).",
        analogy: "5 buckets; fill 2 for one person, 3 for the other. £12 in each — the bigger gets £36.",
      },
      {
        q: "Simplify the ratio 12:18.",
        options: ["2:3", "6:9", "3:2", "4:6"],
        correct: 0,
        concept: "Divide both sides by their highest common factor.",
        deeper: "HCF of 12 and 18 is 6. 12 ÷ 6 = 2, 18 ÷ 6 = 3 → 2:3.",
        analogy: "Like reducing a fraction: 12/18 and 2/3 say the same thing, simplest form.",
      },
    ],
  },
  {
    id: "algebra",
    icon: "🔢",
    name: "Algebra",
    free: false,
    questions: [
      {
        q: "Solve: 2x + 5 = 13. What is x?",
        options: ["4", "9", "6", "3"],
        correct: 0,
        concept: "Do the same to both sides until the letter is alone.",
        deeper: "Subtract 5: 2x = 8. Divide by 2: x = 4. Check: 2(4) + 5 = 13 ✓.",
        analogy: "An equation is a balanced see-saw — peel away +5 then ×2 to leave x.",
      },
      {
        q: "Expand: 3(x + 4).",
        options: ["3x + 12", "3x + 4", "x + 12", "3x + 7"],
        correct: 0,
        concept: "Multiply everything inside the bracket by the term outside.",
        deeper: "3 × x + 3 × 4 = 3x + 12. The 3 touches BOTH terms — forgetting the second gives 3x + 4.",
        analogy: "3 meal deals, each a burger (x) and a £4 drink → 3 burgers + three £4 drinks.",
      },
    ],
  },
  {
    id: "probability",
    icon: "🎲",
    name: "Probability",
    free: false,
    questions: [
      {
        q: "You roll a fair 6-sided dice. What's the probability of getting a 4?",
        options: ["1/6", "1/4", "4/6", "1/2"],
        correct: 0,
        concept: "Probability = ways you want ÷ total equally likely outcomes.",
        deeper: "6 equally likely faces, one is a 4, so P(4) = 1/6 ≈ 0.167.",
        analogy: "Six doors, one prize, all equal — 1 in 6 first go.",
      },
      {
        q: "The probability it rains is 0.3. What's the probability it does NOT rain?",
        options: ["0.7", "0.3", "1.3", "0.07"],
        correct: 0,
        concept: "An event and its opposite cover everything, so they sum to 1.",
        deeper: "P(not rain) = 1 − 0.3 = 0.7.",
        analogy: "If 30% of tomorrows are rainy, the other 70% must be dry.",
      },
    ],
  },
  {
    id: "averages",
    icon: "📊",
    name: "Averages",
    free: false,
    questions: [
      {
        q: "Find the mean of 4, 8, 6, 2.",
        options: ["5", "6", "20", "4"],
        correct: 0,
        concept: "Mean = add all the values, divide by how many there are.",
        deeper: "Sum = 20, count = 4, so 20 ÷ 4 = 5.",
        analogy: "Pool £20 of pocket money among 4 friends — £5 each.",
      },
      {
        q: "Find the median of 7, 3, 9, 1, 5.",
        options: ["5", "9", "7", "4"],
        correct: 0,
        concept: "The middle value — but order the numbers first.",
        deeper: "Ordered: 1, 3, 5, 7, 9. The middle of 5 numbers is the 3rd: 5.",
        analogy: "Line everyone up by height; the median stands dead centre.",
      },
    ],
  },
  {
    id: "pythagoras",
    icon: "📐",
    name: "Pythagoras",
    free: false,
    questions: [
      {
        q: "A right-angled triangle has shorter sides 3 cm and 4 cm. How long is the hypotenuse?",
        options: ["5 cm", "7 cm", "12 cm", "25 cm"],
        correct: 0,
        concept: "a² + b² = c², where c is the hypotenuse (longest side).",
        deeper: "3² + 4² = 9 + 16 = 25, and √25 = 5 cm. (3-4-5 is the classic trio.)",
        analogy: "Two small squares (9 and 16) exactly fill the big square (25); its side is √25 = 5.",
      },
      {
        q: "What is √81?",
        options: ["9", "8", "40.5", "18"],
        correct: 0,
        concept: "A square root asks: what number times itself gives this?",
        deeper: "9 × 9 = 81, so √81 = 9.",
        analogy: "A square tile of area 81 cm² has sides of 9 cm (9 × 9 fills it).",
      },
    ],
  },
  {
    id: "sequences",
    icon: "🪜",
    name: "Sequences",
    free: false,
    questions: [
      {
        q: "What's the next term: 3, 7, 11, 15, ...?",
        options: ["19", "18", "20", "17"],
        correct: 0,
        concept: "Add the same amount each time — the common difference.",
        deeper: "Each step is +4, so 15 + 4 = 19.",
        analogy: "Stairs of equal height — keep adding one step (4).",
      },
      {
        q: "The nth term of a sequence is 2n + 1. What is the 4th term?",
        options: ["9", "8", "7", "24"],
        correct: 0,
        concept: "Substitute the position number n into the rule.",
        deeper: "n = 4: 2(4) + 1 = 9. The rule jumps to any term — the 100th is 201.",
        analogy: "Vending machine: type slot 4, it dispenses term 9.",
      },
    ],
  },
  {
    id: "indices",
    icon: "⏫",
    name: "Powers",
    free: false,
    questions: [
      {
        q: "What is 2³?",
        options: ["8", "6", "9", "23"],
        correct: 0,
        concept: "A power says how many times to multiply the base by itself.",
        deeper: "2³ = 2 × 2 × 2 = 8 (NOT 2 × 3).",
        analogy: "Double from 1 three times: 2, 4, 8.",
      },
      {
        q: "Write 2⁴ × 2³ as a single power of 2.",
        options: ["2⁷", "2¹²", "4⁷", "2¹"],
        correct: 0,
        concept: "Multiplying powers of the same base — ADD the indices.",
        deeper: "2⁴ × 2³ = 2^(4+3) = 2⁷, i.e. seven 2s multiplied together.",
        analogy: "4 twos in one bag, 3 in another — tip together for 7 twos.",
      },
    ],
  },
  {
    id: "area",
    icon: "🟩",
    name: "Area & Perimeter",
    free: false,
    questions: [
      {
        q: "A rectangle is 6 cm by 4 cm. What is its area?",
        options: ["24 cm²", "20 cm²", "10 cm²", "24 cm"],
        correct: 0,
        concept: "Area of a rectangle = length × width, in square units.",
        deeper: "6 × 4 = 24 cm². (Perimeter would be 6+4+6+4 = 20 cm.)",
        analogy: "Tile it with 1 cm squares: 6 across, 4 down = 24 tiles.",
      },
      {
        q: "A triangle has base 10 cm and height 6 cm. Find its area.",
        options: ["30 cm²", "60 cm²", "16 cm²", "30 cm"],
        correct: 0,
        concept: "Area of a triangle = ½ × base × height.",
        deeper: "½ × 10 × 6 = 30 cm². A triangle is half its bounding rectangle (10 × 6 = 60).",
        analogy: "Two identical triangles make a rectangle, so one is half its area.",
      },
    ],
  },
  {
    id: "angles",
    icon: "🔺",
    name: "Angles",
    free: false,
    questions: [
      {
        q: "Angles on a straight line add up to how many degrees?",
        options: ["180°", "90°", "360°", "270°"],
        correct: 0,
        concept: "Angles on a straight line sum to 180°.",
        deeper: "A straight line is half a full turn (360°), so 180°.",
        analogy: "Spin from facing forward to facing backward — that half-turn is 180°.",
      },
      {
        q: "Two angles in a triangle are 50° and 60°. What is the third angle?",
        options: ["70°", "80°", "60°", "110°"],
        correct: 0,
        concept: "A triangle's angles total 180°, so subtract the known two.",
        deeper: "50 + 60 = 110, and 180 − 110 = 70°.",
        analogy: "The three angles share a 180° budget; two spend 110°, leaving 70°.",
      },
    ],
  },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
