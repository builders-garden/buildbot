import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../schemas";
import { addToCastsQueue, addToDCsQueue, addToXMTPQueue } from "../queues";
import { getAddressFromUsername } from "../utils";

/**
 * @dev this function handles the mentions webhook
 * @param {Request} req input express request
 * @param {Response} res output express response
 */
export const mentionsHandler = async (req: Request, res: Response) => {
  console.log(`[/webhooks/mentions] [${Date.now()}] - new mention received.`);

  const { nominator, nominee, points, farcasterId }: MentionsBody = req.body;

  const message: MessageBody = {
    text: `@${nominator} just nominated @${nominee} with ${points} BUILD points`,
  };

  await Promise.all([
    addToCastsQueue(message),
    addToDCsQueue({ ...message, farcasterId }),
    addToXMTPQueue({
      ...message,
      recipient: await getAddressFromUsername(nominee),
    }),
  ]);

  res.status(200).send({ status: "ok" });
};
