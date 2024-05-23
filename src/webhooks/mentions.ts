import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../schemas";
import { addToCastsQueue } from "../queues";
import { getUsernamesFromIds } from "../utils";

/**
 * @dev this function handles the mentions webhook
 * @param {Request} req input express request
 * @param {Response} res output express response
 */
export const mentionsHandler = async (req: Request, res: Response) => {
  console.log(`[/webhooks/mentions] [${Date.now()}] - new mention received.`);

  const { nominatorFarcasterId, nomineeFarcasterId, points }: MentionsBody =
    req.body;

  const { nominator, nominee } = await getUsernamesFromIds([
    nominatorFarcasterId,
    nomineeFarcasterId,
  ]);

  const message: MessageBody = {
    text: `@${nominator} just nominated @${nominee} with ${points} BUILD points`,
  };

  await Promise.all([
    addToCastsQueue(message),
    // addToDCsQueue({ ...message, farcasterId: nomineeFarcasterId }),
    // addToXMTPQueue({
    //   ...message,
    //   recipient: await getAddressFromUsername(nominee),
    // }),
  ]);

  res.status(200).send({ status: "ok" });
};
