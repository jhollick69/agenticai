import Link from "next/link";
import { getEntitlement } from "@/lib/entitlement";

const FEATURES = [
  {
    icon: "💡",
    title: "The concept, in plain English",
    body: "Every answer explains the idea simply — not just whether you got it right.",
  },
  {
    icon: "🔍",
    title: "A deeper dive when you want it",
    body: "Tap for the full working and the common mistakes, so it actually sticks.",
  },
  {
    icon: "🤔",
    title: "A real-life analogy for everything",
    body: "Pizzas, buckets, see-saws — the everyday picture that makes maths click.",
  },
  {
    icon: "🎮",
    title: "Bite-size and a bit addictive",
    body: "Streaks, points and a 50/50 lifeline turn revision into something they'll actually open.",
  },
];

const FAQS = [
  {
    q: "Is it really free to start?",
    a: "Yes. Three full topics (Fractions, Percentages, Ratio) are free forever, no card needed. Premium adds a 7-day free trial on top.",
  },
  {
    q: "What year group is it for?",
    a: "GCSE maths (roughly ages 14–16), but it's great for anyone shoring up the foundations — Years 7–9 included.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, in a couple of clicks. Cancel during the 7-day trial and you're never charged.",
  },
  {
    q: "How is this different from a textbook?",
    a: "It answers the 'but why?' on every single question — the concept, the deeper working, and an analogy — the moment you need it.",
  },
];

export default async function Landing() {
  const ent = await getEntitlement();

  const primary = ent.isPremium
    ? { href: "/learn", label: "Go to your topics →" }
    : { href: "/learn", label: "Start free — no card needed →" };

  return (
    <main>
      <section className="hero">
        <span className="kicker">GCSE Maths · ages 14–16</span>
        <h1 className="heroTitle">
          GCSE maths that finally <span className="grad">makes sense</span>.
        </h1>
        <p className="heroSub">
          Bite-size quizzes that explain the <em>why</em> behind every answer — with a plain-English
          concept, a deeper dive, and a real-life analogy. Built to be the revision app they'll
          actually open.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link href={primary.href} className="btn primary">
            {primary.label}
          </Link>
          {!ent.isPremium && (
            <Link href="#pricing" className="btn">
              See pricing
            </Link>
          )}
        </div>
        <p className="note" style={{ textAlign: "center" }}>
          3 topics free forever · Premium starts with a 7-day free trial
        </p>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature">
            <span className="featureIco">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>How it works</h2>
        <ol className="steps">
          <li>
            <strong>Pick a topic.</strong> Start with a free one — Fractions, Percentages or Ratio.
          </li>
          <li>
            <strong>Answer, then understand.</strong> Every question reveals the concept, a deeper
            dive and an analogy.
          </li>
          <li>
            <strong>Build a streak.</strong> Points and lifelines keep them coming back.
          </li>
          <li>
            <strong>Go Premium</strong> to unlock all 11 topics — free for 7 days.
          </li>
        </ol>
      </section>

      <section className="card" id="pricing">
        <h2 style={{ marginTop: 0 }}>Simple pricing</h2>
        <p className="sub">Try everything free for 7 days. Cancel any time before then and pay nothing.</p>
        <div className="plans">
          <div className="plan">
            <div className="price">£4.99</div>
            <div className="per">per month</div>
          </div>
          <div className="plan">
            <div className="price">£39</div>
            <div className="per">per year · save 35%</div>
          </div>
        </div>
        <div className="actions">
          <Link href={ent.signedIn ? "/account?upgrade=1" : "/account"} className="btn primary">
            {ent.isPremium ? "You're Premium ✦" : "Start your 7-day free trial →"}
          </Link>
          <Link href="/learn" className="btn">
            Or try 3 topics free
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Questions, answered</h2>
        <div className="faq">
          {FAQS.map((item) => (
            <div key={item.q} className="faqItem">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
