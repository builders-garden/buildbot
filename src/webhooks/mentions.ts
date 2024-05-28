import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../schemas.js";
import { getFarcasterUsersByAddresses } from "../utils/index.js";
import { addToCastsQueue } from "../queues/index.js";

/**
 * @dev this function handles the mentions webhook
 * @param {Request} req input express request
 * @param {Response} res output express response
 */
export const mentionsHandler = async (req: Request, res: Response) => {
  const { nominatedWallet, nominatorWallet, points }: MentionsBody = req.body;

  console.log(
    `[/webhooks/mentions] [${Date.now()}] - new mention received - [nominator: ${nominatorWallet}] - [nominated: ${nominatedWallet}] - [points: ${points}].`
  );

  const users = await getFarcasterUsersByAddresses([
    nominatedWallet,
    nominatorWallet,
  ]);

  const nominatedUser = users[nominatedWallet.toLowerCase()];
  const nominatorUser = users[nominatorWallet.toLowerCase()];

  if (!nominatedUser) {
    console.error(
      `[mentionsHandler] [${Date.now()}] - ${nominatedWallet} not found in farcaster.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  if (!nominatorUser) {
    console.error(
      `[mentionsHandler] [${Date.now()}] - ${nominatorWallet} not found in farcaster.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  const message: MessageBody = {
    text: `@${nominatorUser[0].username} just nominated @${
      nominatedUser[0].username
    } with ${points.toFixed(2)} BUILD points`,
  };

  await Promise.all([
    addToCastsQueue(message),
    // addToDCsQueue({ ...message, farcasterId: nominatedUser[0].fid }),
    // addToXMTPQueue({
    //   ...message,
    //   recipient: nominatedWallet,
    // }),
  ]);

  res.status(200).send({ status: "ok" });
};
