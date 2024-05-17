import { Queue, Worker } from "bullmq";
import { MessageBody } from "../schemas";
import { publishCast } from "../utils";
import { env } from "../env";

const CASTS_QUEUE_NAME = "casts";

/**
 * @dev this function process the casts message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processCast = async (job: { data: MessageBody }) => {
  const { text }: MessageBody = job.data;

  console.log(`[casts worker] [${Date.now()}] - new cast received. iterating.`);

  const hash = await publishCast(text, { channelId: env.FARCASTER_CHANNEL_ID });

  console.log(
    `[casts worker] [${Date.now()}] - cast ${hash} published successfully .`
  );
};

// @ts-ignore
const castsWorker = new Worker(CASTS_QUEUE_NAME, processCast);

export const castsQueue = new Queue(CASTS_QUEUE_NAME, {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    enableOfflineQueue: false,
  },
});
