import { Request, Response } from "express";
import { addToDCsQueue } from "../../queues/index.js";
import { MessageBody, MessageWithFarcasterIdBody } from "../../schemas.js";
import { getFarcasterUsersByAddresses } from "../../utils/farcaster.js";

export const sendHandler = async (req: Request, res: Response) => {
  try {
    const { text, sender, receiver }: MessageBody = req.body;

    console.log(
      `[sendHandler] [${new Date().toISOString()}] - new message received.`
    );

    let receiverFid: number;
    // check if receiver is a string or a number
    if (typeof receiver === "string") {
      console.error(
        `[sendHandler] [${new Date().toISOString()}] - receiver is an address.`
      );
      const users = await getFarcasterUsersByAddresses([receiver]);
      const receiverUser = users[receiver.toLowerCase()];
      if (!receiverUser) {
        console.error(
          `[sendHandler] [${new Date().toISOString()}] - receiver not found.`
        );
        return res
          .status(400)
          .send({ status: "nok", error: "receiver not found" });
      }
      receiverFid = receiverUser[0].fid;
    } else {
      console.error(
        `[sendHandler] [${new Date().toISOString()}] - receiver is an id.`
      );
      receiverFid = receiver;
    }

    const message: MessageWithFarcasterIdBody = {
      text,
      farcasterId: receiverFid,
      id: `${sender}-${receiver}-${Date.now()}`,
    };

    await Promise.all([addToDCsQueue(message)]);

    return res.status(200).send({ status: "ok", body: req.body });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[sendHandler] [${new Date().toISOString()}] - error sending message: ${
          error.message
        }.`
      );
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};
