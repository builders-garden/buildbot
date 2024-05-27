import { Queue, Worker } from "bullmq";
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

  const hash = await publishCast(text, {
    replyTo: env.FARCASTER_REPLY_TO_CAST_HASH,
  });

  console.log(
    `[casts worker] [${Date.now()}] - cast ${hash} published successfully .`
  );
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const castsWorker = new Worker(CASTS_QUEUE_NAME, processCast, {
    connection: redisConnection,
  });
}

export const castsQueue = env.REDIS_HOST
  ? new Queue(CASTS_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
