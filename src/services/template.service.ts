import { prisma } from "../config/prisma";
import { templateRepository } from "../repositories/template.repository";
import { AppError } from "../utils/AppError";
import { renderResumePdf, renderTemplate } from "./pdf.service";
import {
  CreateTemplateInput,
  UpdateTemplateInput,
} from "../validators/template.validator";

const PREVIEW_CONTENT = {
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  phoneNumber: "+1 (555) 123-4567",
  linkedinUrl: "https://linkedin.com/in/janedoe",
  address: "San Francisco, CA",
  targetRole: "Senior Software Engineer",
  summary:
    "Pragmatic engineer with 8+ years building reliable backend systems. Reduced p99 latency by 60% on a 50M-user platform.",
  skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "AWS", "GraphQL"],
  experience: [
    {
      title: "Staff Engineer",
      company: "Acme Corp",
      location: "Remote",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Led migration to Kubernetes, cutting deploy time from 25m to 4m",
        "Designed event-sourced billing pipeline processing 12k events/s",
      ],
    },
    {
      title: "Senior Engineer",
      company: "Globex",
      location: "NYC",
      startDate: "Jun 2018",
      endDate: "Dec 2021",
      bullets: ["Owned core auth platform serving 50M users", "Mentored 6 engineers"],
    },
  ],
  projects: [
    {
      name: "OpenFlux",
      description: "Open-source feature-flag SDK with 1.2k GitHub stars.",
      technologies: ["TypeScript", "Vite", "React"],
    },
  ],
  education: [
    { degree: "B.S. Computer Science", school: "UC Berkeley", startDate: "2012", endDate: "2016" },
  ],
  certifications: [{ name: "AWS Solutions Architect", issuer: "AWS", year: "2023" }],
};

export const templateService = {
  async create(adminId: string, input: CreateTemplateInput) {
    return prisma.resumeTemplate.create({
      data: { ...input, createdByAdminId: adminId },
    });
  },

  async listForAdmin(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const [data, total] = await templateRepository.listForAdmin(adminId, params);
    return { data, total };
  },

  async listAvailable(adminId: string) {
    return prisma.resumeTemplate.findMany({
      where: { createdByAdminId: adminId },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  },

  async getById(adminId: string, id: string) {
    const tpl = await prisma.resumeTemplate.findFirst({
      where: { id, createdByAdminId: adminId },
    });
    if (!tpl) throw AppError.notFound("Template not found");
    return tpl;
  },

  async update(adminId: string, id: string, input: UpdateTemplateInput) {
    const existing = await prisma.resumeTemplate.findFirst({
      where: { id, createdByAdminId: adminId },
    });
    if (!existing) throw AppError.notFound("Template not found");
    return prisma.resumeTemplate.update({ where: { id }, data: input });
  },

  async delete(adminId: string, id: string) {
    const existing = await prisma.resumeTemplate.findFirst({
      where: { id, createdByAdminId: adminId },
    });
    if (!existing) throw AppError.notFound("Template not found");
    await prisma.resumeTemplate.delete({ where: { id } });
  },

  async previewHtml(adminId: string, id: string) {
    const tpl = await this.getById(adminId, id);
    const body = renderTemplate(tpl.htmlTemplate, PREVIEW_CONTENT);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${tpl.cssStyles}</style></head><body>${stripBody(body)}</body></html>`;
  },

  async previewPdf(adminId: string, id: string) {
    const tpl = await this.getById(adminId, id);
    return renderResumePdf({
      htmlTemplate: tpl.htmlTemplate,
      cssStyles: tpl.cssStyles,
      content: PREVIEW_CONTENT as any,
    });
  },
};

function stripBody(html: string) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html.replace(/<!DOCTYPE[^>]*>/i, "");
}
