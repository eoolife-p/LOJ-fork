import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "了解我们如何收集、使用和保护你的个人信息。",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
