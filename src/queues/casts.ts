import { MetricsTime, Queue, Worker } from "bullmq";
import { MessageBody } from "../schemas.js";
import { publishCast } from "../utils/index.js";
import { env } from "../env.js";
import { redisConnection } from "./connection.js";

const CASTS_QUEUE_NAME = "casts";

/**
 * @dev this function process the casts message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processCast = async (job: { data: MessageBody }) => {
  const { text }: MessageBody = job.data;

  console.log(`[casts worker] [${Date.now()}] - new cast received. iterating.`);

  try {
    const hash = await publishCast(text, {
      replyTo: env.FARCASTER_REPLY_TO_CAST_HASH,
    });
    console.log(
      `[casts worker] [${Date.now()}] - cast ${hash} published successfully .`
    );
  } catch (error) {
    console.error(
      `[casts worker] [${Date.now()}] - error publishing cast: ${
        error instanceof Error ? error.message : "unknown error"
      }.`
    );
  }
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const castsWorker = new Worker(CASTS_QUEUE_NAME, processCast, {
    connection: redisConnection,
    metrics: {
      maxDataPoints: MetricsTime.ONE_WEEK,
    },
    limiter: {
      max: 1,
      duration: 1000,
    },
  });
}

export const castsQueue = env.REDIS_HOST
  ? new Queue(CASTS_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
