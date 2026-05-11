import { ResumeContent } from "../ai/types";
import {
  BlockConfig,
  BlockKind,
  BlockStyle,
  Density,
  FontFamily,
  TemplateConfig,
  ThemeConfig,
} from "./types";

const FONT_STACKS: Record<FontFamily, string> = {
  Inter: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  Lora: "'Lora', Georgia, 'Times New Roman', serif",
  "Source Sans": "'Source Sans 3', 'Source Sans Pro', Arial, sans-serif",
  Playfair: "'Playfair Display', Georgia, serif",
};

const DENSITY: Record<Density, { lineHeight: number; sectionGap: string; itemGap: string; headingGap: string; pagePad: string }> = {
  compact: { lineHeight: 1.3, sectionGap: "8px", itemGap: "4px", headingGap: "3px", pagePad: "32px 40px" },
  normal: { lineHeight: 1.45, sectionGap: "12px", itemGap: "6px", headingGap: "4px", pagePad: "40px 56px" },
  relaxed: { lineHeight: 1.6, sectionGap: "16px", itemGap: "9px", headingGap: "5px", pagePad: "48px 64px" },
};

function escape(s: unknown): string {
  if (s == null) return "";
  const stripped = String(s).replace(
    /<\s*(\/?)\s*(b|strong|i|em|br)\b[^>]*>/gi,
    (_m, slash, tag) => `<${slash}${tag.toLowerCase()}>`
  );
  const escaped = stripped
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped
    .replace(/&lt;(\/?)(?:b|strong)&gt;/gi, (_m, slash) => `<${slash}b>`)
    .replace(/&lt;(\/?)(?:i|em)&gt;/gi, (_m, slash) => `<${slash}i>`)
    .replace(/&lt;br&gt;/gi, "<br>");
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

function renderExperience(c: ResumeContent, theme: ThemeConfig): string {
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
  const body = theme.timeline ? `<div class="timeline">${items}</div>` : items;
  return `
    <section class="block block-experience">
      <h3>Experience</h3>
      ${body}
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

const RENDERERS: Record<BlockKind, (c: ResumeContent, theme: ThemeConfig) => string> = {
  header: (c) => renderHeader(c),
  summary: (c) => renderSummary(c),
  skills: (c) => renderSkills(c),
  experience: (c, t) => renderExperience(c, t),
  projects: (c) => renderProjects(c),
  education: (c) => renderEducation(c),
  certifications: (c) => renderCertifications(c),
};

function buildCss(theme: ThemeConfig): string {
  const accent = safeAccent(theme.accentColor);
  const fontStack = FONT_STACKS[theme.fontFamily] ?? FONT_STACKS.Inter;
  const d = DENSITY[theme.density] ?? DENSITY.normal;
  const fs = Math.min(13, Math.max(9, theme.baseFontSize || 11));
  const isTwoCol = theme.layout === "two-col";

  return `
@page { size: A4; margin: 0; }
:root { --accent: ${accent}; }
* { box-sizing: border-box; }
html, body, header, section, div, h1, h2, h3, h4, h5, h6, p, ul, ol, li { margin: 0; padding: 0; }
body {
  font-family: ${fontStack};
  color: #1f2937;
  padding: ${d.pagePad};
  font-size: ${fs}pt;
  line-height: ${d.lineHeight};
  orphans: 3;
  widows: 3;
}
.block-header { margin-bottom: ${d.sectionGap}; }
.block-header h1 { font-size: 24pt; color: #111827; line-height: 1.1; }
.block-header h2 { font-size: 12pt; margin-top: 2px; color: var(--accent); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
.block-header .contact { color: #4b5563; font-size: 0.92em; margin-top: 4px; }
.block-header .contact a { color: var(--accent); text-decoration: none; }

.body-grid { ${
    isTwoCol
      ? `column-count: 2; column-gap: 28px;`
      : ""
  } }

section.block { margin-bottom: ${d.sectionGap}; }
section.block:last-child { margin-bottom: 0; }
section.block h3 {
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 3px;
  margin-bottom: ${d.headingGap};
  color: #111827;
  break-after: avoid;
  line-height: 1.2;
}

.item { margin-bottom: ${d.itemGap}; }
.item:last-child { margin-bottom: 0; }
.row { overflow: hidden; line-height: 1.25; break-inside: avoid; }
.row > .dates { float: right; }
.row > span:not(.dates) { float: right; }
.row.sub { color: #4b5563; font-size: 0.95em; }
.dates { color: #6b7280; font-size: 0.9em; white-space: nowrap; }
ul { margin: 2px 0 0 16px; }
li { margin-bottom: 1px; }
p { margin: 0; }

.skills { list-style: none; }
.skills li { display: inline-block; color: #1f2937; padding: 0 6px 0 0; font-size: 0.95em; margin: 0 2px 2px 0; }
.skills li:not(:last-child)::after { content: "·"; color: #9ca3af; margin-left: 8px; }

.tech { margin-top: 2px; }
.tech span { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 1px 8px; border-radius: 4px; font-size: 0.85em; margin: 0 6px 3px 0; }

.certs { list-style: none; }
.certs li { margin-bottom: 2px; }
${
  theme.timeline
    ? `
.block-experience .timeline { border-left: 1.5px solid #d1d5db; padding-left: 20px; margin-left: 4px; }
.block-experience .timeline > .item { position: relative; }
.block-experience .timeline > .item::before { content: ""; position: absolute; left: -25px; top: 6px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 2px #fff, 0 0 0 3px var(--accent); }
`
    : ""
}
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`.trim();
}

export interface RenderedConfig {
  html: string;
  css: string;
}

function blockClass(block: BlockConfig): string {
  return `b-${block.kind}-${block.order}`;
}

function isHex6(color: string | undefined): color is string {
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color);
}

function clampFontSize(n: number | undefined): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(24, Math.max(8, n));
}

function blockStyleCss(block: BlockConfig): string {
  const s: BlockStyle | undefined = block.style;
  if (!s) return "";
  const cls = blockClass(block);
  const decls: string[] = [];
  const headingDecls: string[] = [];

  const fs = clampFontSize(s.fontSize);
  if (fs !== undefined) decls.push(`font-size: ${fs}pt;`);
  if (isHex6(s.textColor)) decls.push(`color: ${s.textColor};`);
  if (s.alignment) decls.push(`text-align: ${s.alignment};`);

  if (s.headingStyle) {
    const hs = s.headingStyle;
    if (hs.bold) headingDecls.push("font-weight: 700;");
    if (hs.italic) headingDecls.push("font-style: italic;");
    if (hs.underline) headingDecls.push("text-decoration: underline;");
    if (hs.uppercase) headingDecls.push("text-transform: uppercase;");
  }

  const out: string[] = [];
  if (decls.length) out.push(`.${cls} { ${decls.join(" ")} }`);
  if (headingDecls.length) out.push(`.${cls} > h3 { ${headingDecls.join(" ")} }`);
  return out.join("\n");
}

export function renderConfig(config: TemplateConfig, content: ResumeContent): RenderedConfig {
  const sorted = [...config.blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);

  const renderOne = (b: BlockConfig): string => {
    const raw = RENDERERS[b.kind](content, config.theme);
    if (!raw) return "";
    return injectClass(raw, blockClass(b));
  };

  const headerBlocks = sorted.filter((b) => b.kind === "header");
  const bodyBlocks = sorted.filter((b) => b.kind !== "header");

  const headerHtml = headerBlocks.map(renderOne).join("");
  const bodyHtml = bodyBlocks.map(renderOne).join("");

  const html =
    config.theme.layout === "two-col"
      ? `${headerHtml}<div class="body-grid">${bodyHtml}</div>`
      : `${headerHtml}${bodyHtml}`;

  const blockCssRules = sorted.map(blockStyleCss).filter(Boolean).join("\n");
  const css = blockCssRules ? `${buildCss(config.theme)}\n\n/* per-block style overrides */\n${blockCssRules}` : buildCss(config.theme);

  return { html, css };
}

function injectClass(html: string, cls: string): string {
  return html.replace(/^(\s*)<(section|header)\b([^>]*)>/, (m, lead, tag, attrs) => {
    if (/\sclass="/.test(attrs)) {
      const updated = attrs.replace(/\sclass="([^"]*)"/, (_a: string, existing: string) => ` class="${existing} ${cls}"`);
      return `${lead}<${tag}${updated}>`;
    }
    return `${lead}<${tag} class="${cls}"${attrs}>`;
  });
}

export function renderFullDocument(config: TemplateConfig, content: ResumeContent): string {
  const { html, css } = renderConfig(config, content);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}</body></html>`;
}
