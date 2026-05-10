import { ResumeContent } from "../ai/types";
import { BlockKind, Density, FontFamily, TemplateConfig, ThemeConfig } from "./types";

const FONT_STACKS: Record<FontFamily, string> = {
  Inter: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  Lora: "'Lora', Georgia, 'Times New Roman', serif",
  "Source Sans": "'Source Sans 3', 'Source Sans Pro', Arial, sans-serif",
  Playfair: "'Playfair Display', Georgia, serif",
};

const DENSITY: Record<Density, { lineHeight: number; sectionGap: string; itemGap: string; pagePad: string }> = {
  compact: { lineHeight: 1.3, sectionGap: "10px", itemGap: "6px", pagePad: "32px 40px" },
  normal: { lineHeight: 1.45, sectionGap: "16px", itemGap: "10px", pagePad: "40px 56px" },
  relaxed: { lineHeight: 1.6, sectionGap: "22px", itemGap: "14px", pagePad: "48px 64px" },
};

function escape(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeAccent(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#2563eb";
}

function renderHeader(c: ResumeContent): string {
  const contactBits: string[] = [];
  if (c.email) contactBits.push(escape(c.email));
  if (c.phoneNumber) contactBits.push(escape(c.phoneNumber));
  if (c.linkedinUrl)
    contactBits.push(`<a href="${escape(c.linkedinUrl)}">${escape(c.linkedinUrl)}</a>`);
  if (c.address) contactBits.push(escape(c.address));
  return `
    <header class="block block-header">
      <h1>${escape(c.fullName)}</h1>
      ${c.targetRole ? `<h2>${escape(c.targetRole)}</h2>` : ""}
      <div class="contact">${contactBits.join(" · ")}</div>
    </header>`;
}

function renderSummary(c: ResumeContent): string {
  if (!c.summary) return "";
  return `
    <section class="block block-summary">
      <h3>Summary</h3>
      <p>${escape(c.summary)}</p>
    </section>`;
}

function renderSkills(c: ResumeContent): string {
  if (!c.skills?.length) return "";
  const items = c.skills.map((s) => `<li>${escape(s)}</li>`).join("");
  return `
    <section class="block block-skills">
      <h3>Skills</h3>
      <ul class="skills">${items}</ul>
    </section>`;
}

function renderExperience(c: ResumeContent): string {
  if (!c.experience?.length) return "";
  const items = c.experience
    .map(
      (e) => `
      <div class="item">
        <div class="row">
          <strong>${escape(e.title)}</strong>
          <span class="dates">${escape(e.startDate)} – ${escape(e.endDate)}</span>
        </div>
        <div class="row sub">
          <em>${escape(e.company)}</em>
          ${e.location ? `<span>${escape(e.location)}</span>` : ""}
        </div>
        ${
          e.bullets?.length
            ? `<ul>${e.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>`
            : ""
        }
      </div>`
    )
    .join("");
  return `
    <section class="block block-experience">
      <h3>Experience</h3>
      ${items}
    </section>`;
}

function renderProjects(c: ResumeContent): string {
  if (!c.projects?.length) return "";
  const items = c.projects
    .map(
      (p) => `
      <div class="item">
        <strong>${escape(p.name)}</strong>
        <p>${escape(p.description)}</p>
        ${
          p.technologies?.length
            ? `<div class="tech">${p.technologies
                .map((t) => `<span>${escape(t)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div>`
    )
    .join("");
  return `
    <section class="block block-projects">
      <h3>Projects</h3>
      ${items}
    </section>`;
}

function renderEducation(c: ResumeContent): string {
  if (!c.education?.length) return "";
  const items = c.education
    .map(
      (e) => `
      <div class="item">
        <div class="row">
          <strong>${escape(e.degree)}</strong>
          <span class="dates">${escape(e.startDate)} – ${escape(e.endDate)}</span>
        </div>
        <div><em>${escape(e.school)}</em></div>
      </div>`
    )
    .join("");
  return `
    <section class="block block-education">
      <h3>Education</h3>
      ${items}
    </section>`;
}

function renderCertifications(c: ResumeContent): string {
  if (!c.certifications?.length) return "";
  const items = c.certifications
    .map(
      (e) =>
        `<li><strong>${escape(e.name)}</strong> — ${escape(e.issuer)} (${escape(e.year)})</li>`
    )
    .join("");
  return `
    <section class="block block-certifications">
      <h3>Certifications</h3>
      <ul class="certs">${items}</ul>
    </section>`;
}

const RENDERERS: Record<BlockKind, (c: ResumeContent) => string> = {
  header: renderHeader,
  summary: renderSummary,
  skills: renderSkills,
  experience: renderExperience,
  projects: renderProjects,
  education: renderEducation,
  certifications: renderCertifications,
};

function buildCss(theme: ThemeConfig): string {
  const accent = safeAccent(theme.accentColor);
  const fontStack = FONT_STACKS[theme.fontFamily] ?? FONT_STACKS.Inter;
  const d = DENSITY[theme.density] ?? DENSITY.normal;
  const fs = Math.min(13, Math.max(9, theme.baseFontSize || 11));
  const isTwoCol = theme.layout === "two-col";

  return `
:root { --accent: ${accent}; }
* { box-sizing: border-box; }
body {
  font-family: ${fontStack};
  color: #1f2937;
  padding: ${d.pagePad};
  font-size: ${fs}pt;
  line-height: ${d.lineHeight};
  margin: 0;
}
.block-header { margin-bottom: ${d.sectionGap}; }
.block-header h1 { font-size: 24pt; margin: 0; color: #111827; }
.block-header h2 { font-size: 12pt; margin: 4px 0 8px; color: var(--accent); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
.block-header .contact { color: #4b5563; font-size: 0.92em; }
.block-header .contact a { color: var(--accent); text-decoration: none; }

.body-grid { ${
    isTwoCol
      ? `display: grid; grid-template-columns: 1fr 2fr; column-gap: 28px;`
      : ""
  } }

section.block { margin-bottom: ${d.sectionGap}; break-inside: avoid; }
section.block h3 {
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 4px;
  margin: 0 0 ${d.itemGap} 0;
  color: #111827;
}

.item { margin-bottom: ${d.itemGap}; }
.row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.row.sub { color: #4b5563; font-size: 0.95em; }
.dates { color: #6b7280; font-size: 0.9em; white-space: nowrap; }
ul { margin: 4px 0 4px 18px; padding: 0; }
li { margin-bottom: 2px; }
p { margin: 4px 0; }

.skills { display: flex; flex-wrap: wrap; gap: 6px 8px; list-style: none; margin: 0; padding: 0; }
.skills li { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); padding: 2px 10px; border-radius: 999px; font-size: 0.88em; font-weight: 500; }

.tech { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tech span { background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; }

.certs { list-style: none; margin: 0; padding: 0; }
.certs li { margin-bottom: 4px; }

@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`.trim();
}

export interface RenderedConfig {
  html: string;
  css: string;
}

export function renderConfig(config: TemplateConfig, content: ResumeContent): RenderedConfig {
  const sorted = [...config.blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);

  const headerBlocks = sorted.filter((b) => b.kind === "header");
  const bodyBlocks = sorted.filter((b) => b.kind !== "header");

  const headerHtml = headerBlocks.map((b) => RENDERERS[b.kind](content)).join("");
  const bodyHtml = bodyBlocks.map((b) => RENDERERS[b.kind](content)).join("");

  const html =
    config.theme.layout === "two-col"
      ? `${headerHtml}<div class="body-grid">${bodyHtml}</div>`
      : `${headerHtml}${bodyHtml}`;

  return { html, css: buildCss(config.theme) };
}

export function renderFullDocument(config: TemplateConfig, content: ResumeContent): string {
  const { html, css } = renderConfig(config, content);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}</body></html>`;
}
