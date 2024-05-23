import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../schemas";
import { addToCastsQueue } from "../queues";
import { getFarcasterUsersByAddresses } from "../utils";

/**
 * @dev this function handles the mentions webhook
 * @param {Request} req input express request
 * @param {Response} res output express response
 */
export const mentionsHandler = async (req: Request, res: Response) => {
  console.log(`[/webhooks/mentions] [${Date.now()}] - new mention received.`);

  const { nominatedWallet, nominatorWallet, points }: MentionsBody = req.body;

  const users = await getFarcasterUsersByAddresses([
    nominatedWallet,
    nominatorWallet,
  ]);

  const nominatedUser = users[nominatedWallet];
  const nominatorUser = users[nominatorWallet];

  if (!nominatedUser || !nominatorUser) {
    console.error(
      `[mentionsHandler] [${Date.now()}] - user not found in farcaster.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  const message: MessageBody = {
    text: `@${nominatorUser[0].username} just nominated @${nominatedUser[0].username} with ${points} BUILD points`,
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
