import { Queue, Worker } from "bullmq";
import { sendDirectCast } from "../utils/index.js";
import { MessageWithFarcasterIdBody } from "../schemas.js";
import { env } from "../env.js";
import { redisConnection } from "./index.js";

const DCS_QUEUE_NAME = "dcs";

/**
 * @dev this function process the dc message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processDC = async (job: { data: MessageWithFarcasterIdBody }) => {
  const { text, farcasterId } = job.data;

  console.log(`[dcs worker] [${Date.now()}] - new dc received. iterating.`);

  await sendDirectCast(farcasterId, text);

  console.log(`[dcs worker] [${Date.now()}] - dc sent successfully.`);
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const dcsWorker = new Worker(DCS_QUEUE_NAME, processDC, {
    connection: redisConnection,
  });
}

export const dcsQueue = env.REDIS_HOST
  ? new Queue(DCS_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
