import { Queue, QueueEvents } from "bullmq";
import { getRedis } from "../config/redis";

export const GENERATION_QUEUE = "resume-generation";

export interface GenerationJobData {
  generationId: string;
}

let queue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!queue) {
    queue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
        removeOnFail: { age: 14 * 24 * 3600 },
      },
    });
  }
  return queue;
}

let events: QueueEvents | null = null;
export function getGenerationQueueEvents(): QueueEvents {
  if (!events) {
    events = new QueueEvents(GENERATION_QUEUE, { connection: getRedis() });
  }
  return events;
}
