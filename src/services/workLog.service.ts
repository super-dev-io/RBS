import { workLogRepository } from "../repositories/workLog.repository";

function dayBoundary(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export const workLogService = {
  async listForAdmin(
    adminId: string,
    params: {
      page: number;
      pageSize: number;
      bidderId?: string;
      date?: string;
      from?: string;
      to?: string;
    }
  ) {
    let from: Date | undefined;
    let to: Date | undefined;
    if (params.date) {
      ({ from, to } = dayBoundary(params.date));
    } else {
      if (params.from) from = new Date(`${params.from}T00:00:00.000Z`);
      if (params.to) {
        const t = new Date(`${params.to}T00:00:00.000Z`);
        to = new Date(t.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    const [data, total] = await workLogRepository.listForAdmin(adminId, {
      page: params.page,
      pageSize: params.pageSize,
      bidderId: params.bidderId,
      from,
      to,
    });
    return { data, total };
  },

  async listForBidder(
    bidderId: string,
    params: { page: number; pageSize: number; date?: string; from?: string; to?: string }
  ) {
    let from: Date | undefined;
    let to: Date | undefined;
    if (params.date) {
      ({ from, to } = dayBoundary(params.date));
    } else {
      if (params.from) from = new Date(`${params.from}T00:00:00.000Z`);
      if (params.to) {
        const t = new Date(`${params.to}T00:00:00.000Z`);
        to = new Date(t.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    const [data, total] = await workLogRepository.listForBidder(bidderId, {
      page: params.page,
      pageSize: params.pageSize,
      from,
      to,
    });
    return { data, total };
  },
};
