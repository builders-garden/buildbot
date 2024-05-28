import { Request, Response } from "express";
import { castsQueue } from "../../queues/casts.js";
import { dcsQueue } from "../../queues/dcs.js";
import { xmtpQueue } from "../../queues/xmtp.js";

export const metricsHandler = async (_: Request, res: Response) => {
  const [
    castsCompleted,
    castsFailed,
    dcsCompleted,
    dcsFailed,
    xmtpCompleted,
    xmtpFailed,
  ] = await Promise.all([
    castsQueue?.getMetrics("completed"),
    castsQueue?.getMetrics("failed"),
    dcsQueue?.getMetrics("completed"),
    dcsQueue?.getMetrics("failed"),
    xmtpQueue?.getMetrics("completed"),
    xmtpQueue?.getMetrics("failed"),
  ]);

  res.status(200).send({
    result: {
      casts: {
        completed: castsCompleted,
        failed: castsFailed,
      },
      dcs: {
        completed: dcsCompleted,
        failed: dcsFailed,
      },
      xmtp: {
        completed: xmtpCompleted,
        failed: xmtpFailed,
      },
    },
  });
};
