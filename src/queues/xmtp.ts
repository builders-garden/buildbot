import { MetricsTime, Queue, Worker } from "bullmq";
import { sendXMTPMessage } from "../utils/index.js";
import { MessageWithRecipientBody } from "../schemas.js";
import { env } from "../env.js";
import { redisConnection } from "./connection.js";

const XMTP_QUEUE_NAME = "xmtp";

/**
 * @dev this function process the xmtp message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processXMTPMessage = async (job: {
  data: MessageWithRecipientBody;
}) => {
  const { text, recipient }: MessageWithRecipientBody = job.data;

  console.log(
    `[xmtp worker] [${Date.now()}] - new xmtp message received. iterating.`
  );

  await sendXMTPMessage(recipient, text);

  console.log(
    `[xmtp worker] [${Date.now()}] - xmtp message sent successfully.`
  );
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const xmtpWorker = new Worker(XMTP_QUEUE_NAME, processXMTPMessage, {
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

export const xmtpQueue = env.REDIS_HOST
  ? new Queue(XMTP_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
