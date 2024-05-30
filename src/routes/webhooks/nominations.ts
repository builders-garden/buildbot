import { Request, Response } from "express";

export const nominationsHandler = async (req: Request, res: Response) => {
  const { body } = req;

  console.log(
    `[/webhooks/nominations] [${Date.now()}] - new nomination on fc received - [${JSON.stringify(
      body
    )}].`
  );

  res.status(200).send({ status: "ok" });
};
