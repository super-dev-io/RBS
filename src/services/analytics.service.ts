import { prisma } from "../config/prisma";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const analyticsService = {
  async resumesPerDay(adminId: string, days = 7) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const rows = await prisma.resumeGeneration.findMany({
      where: {
        profile: { createdByAdminId: adminId },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });

    const counts = new Map<string, number>();
    for (const r of rows) counts.set(dayKey(r.createdAt), (counts.get(dayKey(r.createdAt)) ?? 0) + 1);

    const out: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = dayKey(d);
      out.push({ date: key, count: counts.get(key) ?? 0 });
    }
    return out;
  },
};
