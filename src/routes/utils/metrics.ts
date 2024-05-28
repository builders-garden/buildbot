import { Request, Response } from "express";
import { castsQueue } from "../../queues/casts.js";
import { dcsQueue } from "../../queues/dcs.js";
import { xmtpQueue } from "../../queues/xmtp.js";

export const metricsHandler = async (_: Request, res: Response) => {
  const [castsFailed, dcsFailed, xmtpFailed] = await Promise.all([
    castsQueue?.getMetrics("failed"),
    dcsQueue?.getMetrics("failed"),
    xmtpQueue?.getMetrics("failed"),
  ]);

  res.status(200).send({
    result: {
      casts: {
        completed: castsFailed!.meta.count - castsFailed!.count,
        failed: castsFailed?.count,
        failedJobs: castsFailed?.data,
        performance: 100 - (castsFailed!.count / castsFailed!.meta.count) * 100,
      },
      dcs: {
        completed: dcsFailed!.meta.count - dcsFailed!.count,
        failed: dcsFailed?.count,
        failedJobs: dcsFailed?.data,
        performance: 100 - (dcsFailed!.count / dcsFailed!.meta.count) * 100,
      },
      xmtp: {
        completed: xmtpFailed!.meta.count - xmtpFailed!.count,
        failed: xmtpFailed?.count,
        failedJobs: dcsFailed?.data,
        performance: 100 - (xmtpFailed!.count / xmtpFailed!.meta.count) * 100,
      },
    },
  });
};
