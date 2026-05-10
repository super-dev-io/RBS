import { createGenerationWorker } from "./workers/generation.worker";
import { logger } from "./utils/logger";
import { shutdownPdf } from "./services/pdf.service";
import { prisma } from "./config/prisma";

async function start() {
  const worker = createGenerationWorker();
  logger.info("Generation worker started");

  const shutdown = async (signal: string) => {
    logger.info(`Worker received ${signal}, shutting down…`);
    await worker.close();
    await shutdownPdf();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error({ err }, "Failed to start worker");
  process.exit(1);
});
