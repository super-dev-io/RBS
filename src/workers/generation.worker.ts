import { Worker } from "bullmq";
import { GENERATION_QUEUE, GenerationJobData } from "../queues/generation.queue";
import { getRedis } from "../config/redis";
import { generationService } from "../services/generation.service";
import { logger } from "../utils/logger";

export function createGenerationWorker() {
  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE,
    async (job) => {
      logger.info({ jobId: job.id, generationId: job.data.generationId }, "Processing generation");
      await generationService.processGeneration(job.data.generationId, {
        generateCoverLetter: job.data.generateCoverLetter ?? true,
      });
    },
    {
      connection: getRedis(),
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
    }
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Generation job failed");
  });
  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Generation job completed");
  });

  return worker;
}
