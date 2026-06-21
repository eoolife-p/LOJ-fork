import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "邮箱验证",
  description: "验证你的邮箱地址以激活账号。",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
