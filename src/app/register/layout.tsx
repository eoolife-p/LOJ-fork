import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注册",
  description: "创建新账号，开始在线编程评测。",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
