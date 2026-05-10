import puppeteer, { Browser } from "puppeteer";
import { ResumeContent } from "./ai";
import { TemplateConfig } from "./templating/types";
import { renderFullDocument } from "./templating/blockRenderer";

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

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 15_000 });
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
