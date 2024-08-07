import { MetricsTime, Queue, Worker } from "bullmq";
import { sendDirectCast } from "../utils/index.js";
import { MessageWithFarcasterIdBody } from "../schemas.js";
import { env } from "../env.js";
import { redisConnection } from "./connection.js";

const DCS_QUEUE_NAME = "dcs";

/**
 * @dev this function process the dc message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processDC = async (job: { data: MessageWithFarcasterIdBody }) => {
  const { text, farcasterId, sender } = job.data;

  console.log(`[dcs worker] [${Date.now()}] - new dc received. iterating.`);
  try {
    await sendDirectCast(farcasterId, text, sender);
    console.log(`[dcs worker] [${Date.now()}] - dc sent successfully.`);
  } catch (error) {
    console.error(error);
  }
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const dcsWorker = new Worker(DCS_QUEUE_NAME, processDC, {
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

export const dcsQueue = env.REDIS_HOST
  ? new Queue(DCS_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
