import IORedis, { Redis } from "ioredis";
import { env } from "./env";

let connection: Redis | null = null;

export function getRedis(): Redis {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}
