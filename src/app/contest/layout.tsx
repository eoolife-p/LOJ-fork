import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "比赛",
  description: "参加在线编程竞赛，ACM/OI 赛制，挑战自我与队友。",
  alternates: { canonical: "/contest" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
