import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getEntitlement } from "@/lib/entitlement";

export const metadata: Metadata = {
  title: "GCSE Maths Lab",
  description: "Fun, bite-size GCSE maths quizzes with concepts, deeper dives and analogies.",
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
        </div>
      </body>
    </html>
  );
}
