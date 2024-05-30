import { MetricsTime, Queue, Worker } from "bullmq";
import { MessageBody } from "../schemas.js";
import { publishCast } from "../utils/index.js";
import { env } from "../env.js";
import { redisConnection } from "./connection.js";
import { AxiosError } from "axios";

const CASTS_QUEUE_NAME = "casts";

/**
 * @dev this function process the casts message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processCast = async (job: { data: MessageBody }) => {
  const { text }: MessageBody = job.data;

  console.log(`[casts worker] [${Date.now()}] - new cast received. iterating.`);

  const hash = await publishCast(text, {
    replyTo: env.FARCASTER_REPLY_TO_CAST_HASH,
  });
  console.log(
    `[casts worker] [${Date.now()}] - cast ${hash} published successfully .`
  );
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const castsWorker = new Worker(
    CASTS_QUEUE_NAME,
    async (job: { data: MessageBody }) => {
      try {
        await processCast(job);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 429) {
          console.log(
            `[casts worker] [${Date.now()}] - rate limited, trying later.`
          );
          await castsWorker.rateLimit(1000 * 5);
          throw Worker.RateLimitError();
        } else if (error instanceof Error) {
          console.error(
            `[casts worker] [${Date.now()}] - error processing cast: ${
              error.message
            }.`
          );
          throw error;
        }
      }
    },
    {
      connection: redisConnection,
      metrics: {
        maxDataPoints: MetricsTime.ONE_WEEK,
      },
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );
}

export const castsQueue = env.REDIS_HOST
  ? new Queue(CASTS_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
