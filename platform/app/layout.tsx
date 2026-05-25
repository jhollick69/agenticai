import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getEntitlement } from "@/lib/entitlement";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DESCRIPTION =
  "GCSE maths that finally makes sense. Bite-size quizzes that explain the why behind every answer — with a plain-English concept, a deeper dive and a real-life analogy.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GCSE Maths Lab — maths that finally makes sense",
    template: "%s · GCSE Maths Lab",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "GCSE Maths Lab — maths that finally makes sense",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "GCSE Maths Lab",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "GCSE Maths Lab", description: DESCRIPTION },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ent = await getEntitlement();
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <div className="topbar">
            <Link href="/" className="brand">
              🧮 GCSE Maths Lab
            </Link>
            <Link href="/learn" className="btn">
              Topics
            </Link>
            {ent.signedIn ? (
              <>
                <span className={"pill" + (ent.isPremium ? " premium" : "")}>
                  {ent.isPremium ? "✦ Premium" : "👤 Free"}
                </span>
                <Link href="/account" className="btn">
                  Account
                </Link>
              </>
            ) : (
              <Link href="/account" className="btn">
                Sign in
              </Link>
            )}
          </div>
          {children}
          <footer className="footer">
            <Link href="/learn">Topics</Link>
            <Link href="/account">Account</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <span className="footMuted">© {new Date().getFullYear()} GCSE Maths Lab</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
