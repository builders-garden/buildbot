import { Request, Response } from "express";
import { MentionsBody, MessageBody } from "../../schemas.js";
import {
  getFarcasterUsersByAddresses,
  isCorrectUser,
} from "../../utils/index.js";
import { addToCastsQueue } from "../../queues/index.js";

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

  if (points < 2000) {
    console.error(
      `[/webhooks/mentions] [${Date.now()}] - points below minimum threshold.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  const users = await getFarcasterUsersByAddresses([
    nominatedWallet,
    nominatorWallet,
  ]);

  const nominatedUser = users[nominatedWallet.toLowerCase()];
  const nominatorUser = users[nominatorWallet.toLowerCase()];

  if (!nominatedUser) {
    console.error(
      `[/webhooks/mentions] [${Date.now()}] - ${nominatedWallet} not found in farcaster.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  if (!nominatorUser) {
    console.error(
      `[/webhooks/mentions] [${Date.now()}] - ${nominatorWallet} not found in farcaster.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  const nominatedUsername = nominatedUser[0].username;
  const nominatorUsername = nominatorUser[0].username;

  if (!isCorrectUser(nominatedUser[0], nominatedWallet)) {
    console.error(
      `[/webhooks/mentions] [${Date.now()}] - nominated user mismatch: ${nominatedUsername} does not match ${nominatedWallet}.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  if (!isCorrectUser(nominatorUser[0], nominatorWallet)) {
    console.error(
      `[/webhooks/mentions] [${Date.now()}] - nominator user mismatch: ${nominatorUsername} does not match ${nominatorWallet}.`
    );
    res.status(200).send({ status: "nok" });
    return;
  }

  console.log(
    `[/webhooks/mentions] - from ${nominatorUsername} [${nominatorWallet}] to ${nominatedUsername} [${nominatedWallet}]`
  );

  const message: MessageBody = {
    id: `${nominatorWallet}-${nominatedWallet}-${Date.now()}`,
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
