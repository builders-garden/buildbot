import { MetricsTime, Queue, Worker } from "bullmq";
import { ReplyBody } from "../schemas.js";
import { env } from "../env.js";
import { redisConnection } from "./connection.js";
import { AxiosError } from "axios";
import { publishCast } from "../utils/farcaster.js";

const REPLIES_QUEUE_NAME = "replies";

/**
 * @dev this function process the reply message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processReply = async (job: { data: ReplyBody }) => {
  // @ts-ignore
  const { text, replyTo }: ReplyBody = job.data;

  console.log(
    `[replies worker] [${Date.now()}] - new reply received. iterating.`
  );

  const hash = await publishCast(text, {
    replyTo,
  });

  console.log(
    `[replies worker] [${Date.now()}] - reply ${hash} published successfully .`
  );
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const repliesWorker = new Worker(
    REPLIES_QUEUE_NAME,
    async (job: { data: ReplyBody }) => {
      try {
        await processReply(job);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 429) {
          console.log(
            `[replies worker] [${Date.now()}] - rate limited, trying later.`
          );
          await repliesWorker.rateLimit(1000 * 5);
          throw Worker.RateLimitError();
        } else if (error instanceof Error) {
          console.error(
            `[replies worker] [${Date.now()}] - error processing reply: ${
              error.message
            }.`
          );
        }
      }
    },
    {
      connection: redisConnection,
      metrics: {
        maxDataPoints: MetricsTime.ONE_WEEK,
      },
      limiter: {
        max: 1,
        duration: 1000 * 60,
      },
    }
  );
}

export const repliesQueue = env.REDIS_HOST
  ? new Queue(REPLIES_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
