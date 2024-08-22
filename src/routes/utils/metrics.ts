import { Request, Response } from "express";
// import { castsQueue } from "../../queues/casts.js";
import { dcsQueue } from "../../queues/dcs.js";
import { xmtpQueue } from "../../queues/xmtp.js";
import { repliesQueue } from "../../queues/replies.js";

export const metricsHandler = async (_: Request, res: Response) => {
  // const [
  //   // castsFailed,
  //   repliesFailed,
  //   repliesCompleted,
  //   dcsFailed,
  //   dcsCompleted,
  //   xmtpFailed,
  //   xmtpCompleted,
  // ] = await Promise.all([
  //   // castsQueue?.getMetrics("failed"),
  //   repliesQueue?.getMetrics("failed"),
  //   repliesQueue?.getMetrics("completed"),
  //   dcsQueue?.getMetrics("failed"),
  //   dcsQueue?.getMetrics("completed"),
  //   xmtpQueue?.getMetrics("failed"),
  //   xmtpQueue?.getMetrics("completed"),
  // ]);

  res.status(200).send({
    result: {
      // casts: castsFailed
      //   ? {
      //       completed: castsFailed!.meta.count - castsFailed!.count,
      //       failed: castsFailed?.count,
      //       performance:
      //         100 - (castsFailed!.count / castsFailed!.meta.count) * 100,
      //     }
      //   : null,
      replies: {
        completed: await repliesQueue?.getCompletedCount(),
        failed: await repliesQueue?.getFailedCount(),
        waiting: await repliesQueue?.getWaitingCount(),
        delayed: await repliesQueue?.getDelayedCount(),
      },
      dcs: {
        completed: await dcsQueue?.getCompletedCount(),
        failed: await dcsQueue?.getFailedCount(),
        waiting: await dcsQueue?.getWaitingCount(),
        delayed: await dcsQueue?.getDelayedCount(),
      },
      xmtp: {
        completed: await xmtpQueue?.getCompletedCount(),
        failed: await xmtpQueue?.getFailedCount(),
        waiting: await xmtpQueue?.getWaitingCount(),
        delayed: await xmtpQueue?.getDelayedCount(),
      },
    },
  });
};
