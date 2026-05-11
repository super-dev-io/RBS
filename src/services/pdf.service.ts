import { spawn } from "child_process";
import puppeteer, { Browser } from "puppeteer";
import { env } from "../config/env";
import { ResumeContent } from "./ai";
import { TemplateConfig } from "./templating/types";
import { renderFullDocument } from "./templating/blockRenderer";

/**
 * Puppeteer is retained ONLY for admin template thumbnails (PNG screenshots).
 * The hot path — resume + cover-letter PDFs rendered on every Download — uses
 * WeasyPrint (Python) via stdin/stdout. WeasyPrint is ~30–50MB RAM/render vs
 * Puppeteer's ~150–250MB, which matters on the 800MB VPS.
 */

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

export interface RenderResumePdfArgs {
  config: TemplateConfig;
  content: ResumeContent;
}

export async function renderResumePdf({ config, content }: RenderResumePdfArgs): Promise<Buffer> {
  const fullHtml = renderFullDocument(config, content);
  return htmlToPdfWithWeasyPrint(fullHtml);
}

export interface RenderTemplateThumbnailArgs {
  config: TemplateConfig;
  content: ResumeContent;
}

export async function renderTemplateThumbnailPng({
  config,
  content,
}: RenderTemplateThumbnailArgs): Promise<Buffer> {
  const fullHtml = renderFullDocument(config, content);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 800, height: 560, deviceScaleFactor: 1.5 });
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const shot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 800, height: 560 },
    });
    return Buffer.from(shot);
  } finally {
    await page.close();
  }
}

export interface RenderCoverLetterPdfArgs {
  resume: ResumeContent;
  coverLetterText: string;
}

export async function renderCoverLetterPdf({
  resume,
  coverLetterText,
}: RenderCoverLetterPdfArgs): Promise<Buffer> {
  const html = renderCoverLetterHtml(resume, coverLetterText);
  return htmlToPdfWithWeasyPrint(html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCoverLetterHtml(resume: ResumeContent, body: string): string {
  const contactBits: string[] = [];
  if (resume.email) contactBits.push(escapeHtml(resume.email));
  if (resume.phoneNumber) contactBits.push(escapeHtml(resume.phoneNumber));
  if (resume.linkedinUrl) contactBits.push(escapeHtml(resume.linkedinUrl));
  if (resume.address) contactBits.push(escapeHtml(resume.address));

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 18mm 22mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.55; margin: 0; }
  header { margin-bottom: 28px; }
  header h1 { font-size: 22pt; margin: 0; color: #111827; }
  header .contact { color: #4b5563; font-size: 0.92em; margin-top: 4px; }
  p { margin: 0 0 12px; }
</style></head><body>
  <header>
    <h1>${escapeHtml(resume.fullName)}</h1>
    <div class="contact">${contactBits.join(" · ")}</div>
  </header>
  ${paragraphs}
</body></html>`;
}

/**
 * Render HTML → PDF by piping through `weasyprint - -` (stdin → stdout).
 *
 * Install on the VPS:
 *   apt-get install -y weasyprint            # Debian/Ubuntu
 *   pip install weasyprint                   # or, latest
 */
function htmlToPdfWithWeasyPrint(html: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(env.WEASYPRINT_BIN, ["-", "-"], { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    let settled = false;

    const finish = (cb: () => void) => {
      if (!settled) {
        settled = true;
        cb();
      }
    };

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      finish(() => reject(new Error(`WeasyPrint timed out after ${env.WEASYPRINT_TIMEOUT_MS}ms`)));
    }, env.WEASYPRINT_TIMEOUT_MS);

    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.stderr.on("data", (c: Buffer) => errChunks.push(c));
    proc.on("error", (err) => {
      clearTimeout(timer);
      finish(() => reject(new Error(`Failed to spawn WeasyPrint (${env.WEASYPRINT_BIN}): ${err.message}`)));
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        finish(() => resolve(Buffer.concat(chunks)));
      } else {
        const stderr = Buffer.concat(errChunks).toString("utf8");
        finish(() => reject(new Error(`WeasyPrint exited ${code}: ${stderr.slice(0, 500)}`)));
      }
    });

    proc.stdin.on("error", (err) => {
      clearTimeout(timer);
      finish(() => reject(err));
    });
    proc.stdin.end(html, "utf8");
  });
}
