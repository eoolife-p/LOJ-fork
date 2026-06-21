import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "讨论",
  description: "编程技术交流社区，分享解题思路与学习心得。",
  alternates: { canonical: "/discussions" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
