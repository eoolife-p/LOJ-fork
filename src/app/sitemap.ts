import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const lastmod = new Date().toISOString();

  const staticPages = [
    { url: baseUrl, changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/problems`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/contest`, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/training`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/rank`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/discussions`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/register`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: p.url,
    lastModified: lastmod,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const problems = await prisma.problem.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    for (const p of problems) {
      entries.push({
        url: `${baseUrl}/problems/${p.id}`,
        lastModified: p.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const contests = await prisma.contest.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
    });
    for (const c of contests) {
      entries.push({
        url: `${baseUrl}/contest/${c.id}`,
        lastModified: c.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    const trainings = await prisma.training.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
    });
    for (const t of trainings) {
      entries.push({
        url: `${baseUrl}/training/${t.id}`,
        lastModified: t.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {}

  return entries;
}
