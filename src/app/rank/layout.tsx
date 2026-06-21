import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "排名",
  description: "用户排名，按AC数量、Rating 综合排名。",
  alternates: { canonical: "/rank" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
