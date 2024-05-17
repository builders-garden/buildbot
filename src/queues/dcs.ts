import { Queue, Worker } from "bullmq";
import { sendDirectCast } from "../utils";
import { MessageWithRecipientBody } from "../schemas";
import { env } from "../env";

const DCS_QUEUE_NAME = "dcs";

/**
 * @dev this function process the dc message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processDC = async (job: { data: MessageWithRecipientBody }) => {
  const { text, recipient } = job.data;

  console.log(`[dcs worker] [${Date.now()}] - new dc received. iterating.`);

  await sendDirectCast(text, recipient);

  console.log(`[dcs worker] [${Date.now()}] - dc sent successfully.`);
};

// @ts-ignore
const dcsWorker = new Worker(DCS_QUEUE_NAME, processDC);

export const dcsQueue = new Queue(DCS_QUEUE_NAME, {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    enableOfflineQueue: false,
  },
});
