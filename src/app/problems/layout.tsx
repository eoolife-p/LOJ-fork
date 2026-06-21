import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "题库",
  description: "浏览全部编程题目，按难度和标签筛选，提交代码并查看判题结果。",
  alternates: { canonical: "/problems" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
