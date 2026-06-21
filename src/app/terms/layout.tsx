import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "用户协议",
  description: "使用本站服务即表示你同意本用户协议的所有条款。",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
