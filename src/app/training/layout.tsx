import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "训练",
  description: "系统化编程训练题单，从入门到精通。",
  alternates: { canonical: "/training" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
