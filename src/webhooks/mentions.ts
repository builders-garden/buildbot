import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../schemas.js";
import { getFarcasterUsersByAddresses } from "../utils/index.js";

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
    text: `@${nominatorUser[0].username} just nominated @${nominatedUser[0].username} with ${points} BUILD points`,
  };

  await Promise.all([
    // addToCastsQueue(message),
    // addToDCsQueue({ ...message, farcasterId: nomineeFarcasterId }),
    // addToXMTPQueue({
    //   ...message,
    //   recipient: await getAddressFromUsername(nominee),
    // }),
  ]);

  res.status(200).send({ status: "ok" });
};
