import puppeteer, { Browser } from "puppeteer";
import { ResumeContent } from "./ai";
import { AppError } from "../utils/AppError";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

export async function shutdownPdf() {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

/**
 * Minimal mustache-like renderer:
 *   {{name}}            – escaped value
 *   {{{name}}}          – raw (no escape)
 *   {{#section}}…{{/section}}        – array iteration or truthy block
 *   {{^section}}…{{/section}}        – inverted (renders if falsy/empty)
 *   inside iteration, "{{.}}" prints current scalar value, "{{key}}" prints field
 * Supports dotted paths like {{certifications.length}}.
 */
export function renderTemplate(template: string, data: any): string {
  return renderSection(template, [data]);
}

function renderSection(template: string, stack: any[]): string {
  const tagRegex = /\{\{([#^\/&!]?)\s*([\w.\-]+)\s*\}\}|\{\{\{\s*([\w.\-]+)\s*\}\}\}/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(template)) !== null) {
    result += template.slice(lastIndex, match.index);
    lastIndex = tagRegex.lastIndex;

    const [, sigil, name, rawName] = match;

    if (rawName) {
      const v = lookup(stack, rawName);
      result += v == null ? "" : String(v);
      continue;
    }

    if (sigil === "!" ) continue;

    if (sigil === "#" || sigil === "^") {
      const closeTag = `{{/${name}}}`;
      const closeIdx = findMatchingClose(template, tagRegex.lastIndex, name);
      if (closeIdx === -1) {
        throw new AppError(`Unclosed template section: ${name}`, 500, "TEMPLATE_ERROR");
      }
      const inner = template.slice(tagRegex.lastIndex, closeIdx);
      const after = closeIdx + closeTag.length;
      const value = lookup(stack, name);

      if (sigil === "#") {
        if (Array.isArray(value)) {
          for (const item of value) {
            result += renderSection(inner, [...stack, item]);
          }
        } else if (value) {
          result += renderSection(inner, [...stack, value]);
        }
      } else {
        // inverted
        if (!value || (Array.isArray(value) && value.length === 0)) {
          result += renderSection(inner, stack);
        }
      }

      tagRegex.lastIndex = after;
      lastIndex = after;
      continue;
    }

    if (sigil === "&") {
      const v = lookup(stack, name);
      result += v == null ? "" : String(v);
      continue;
    }

    // default: escaped value
    const v = lookup(stack, name);
    result += escapeHtml(v == null ? "" : String(v));
  }

  result += template.slice(lastIndex);
  return result;
}

function findMatchingClose(template: string, fromIndex: number, name: string): number {
  const open = new RegExp(`\\{\\{[#^]\\s*${escapeRegex(name)}\\s*\\}\\}`, "g");
  const close = new RegExp(`\\{\\{/\\s*${escapeRegex(name)}\\s*\\}\\}`, "g");
  open.lastIndex = fromIndex;
  close.lastIndex = fromIndex;

  let depth = 1;
  let pos = fromIndex;
  while (pos < template.length) {
    open.lastIndex = pos;
    close.lastIndex = pos;
    const o = open.exec(template);
    const c = close.exec(template);
    if (!c) return -1;
    if (o && o.index < c.index) {
      depth++;
      pos = o.index + o[0].length;
    } else {
      depth--;
      if (depth === 0) return c.index;
      pos = c.index + c[0].length;
    }
  }
  return -1;
}

function lookup(stack: any[], name: string): any {
  if (name === ".") return stack[stack.length - 1];
  const parts = name.split(".");
  for (let i = stack.length - 1; i >= 0; i--) {
    let ctx = stack[i];
    let found = true;
    for (const p of parts) {
      if (ctx == null) {
        found = false;
        break;
      }
      ctx = ctx[p];
    }
    if (found && ctx !== undefined) return ctx;
  }
  return undefined;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface RenderResumePdfArgs {
  htmlTemplate: string;
  cssStyles: string;
  content: ResumeContent;
}

export async function renderResumePdf({
  htmlTemplate,
  cssStyles,
  content,
}: RenderResumePdfArgs): Promise<Buffer> {
  const html = renderTemplate(htmlTemplate, content);
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${cssStyles}</style></head><body>${stripDoctype(html)}</body></html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

function stripDoctype(html: string): string {
  // If template already has <html> wrapper, strip it so we don't double-wrap.
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];
  return html.replace(/<!DOCTYPE[^>]*>/i, "");
}
