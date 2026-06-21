import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录",
  description: "登录你的账号，开始编程之旅。",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
