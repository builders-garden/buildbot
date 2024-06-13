import { Request, Response } from "express";
import { addToDCsQueue, addToXMTPQueue } from "../../queues/index.js";
import {
  ChannelService,
  MessageBody,
  MessageWithFarcasterIdBody,
  MessageWithRecipientBody,
} from "../../schemas.js";
import {
  getFarcasterUsersByAddresses,
  getFarcasterUsersByFid,
} from "../../utils/farcaster.js";

export const sendHandler = async (req: Request, res: Response) => {
  try {
    const { text, sender, receiver, channels }: MessageBody = req.body;

    console.log(
      `[sendHandler] [${new Date().toISOString()}] - new message request received.`
    );

    const jobsToRun: Promise<void>[] = [];

    if (channels.includes(ChannelService.FarcasterDC)) {
      console.log(
        `[sendHandler] [${new Date().toISOString()}] - send a message using farcaster direct casts.`
      );
      let receiverFid: number;
      // check if receiver is an address or a fid
      if (typeof receiver === "string") {
        console.log(
          `[sendHandler] [${new Date().toISOString()}] - [FDC] - receiver is an address.`
        );
        const users = await getFarcasterUsersByAddresses([receiver]);
        const receiverUser = users[receiver.toLowerCase()];
        if (!receiverUser) {
          console.log(
            `[sendHandler] [${new Date().toISOString()}] - [FDC] - receiver not found.`
          );
          return res
            .status(400)
            .send({ status: "nok", error: "receiver not found" });
        }
        receiverFid = receiverUser[0].fid;
      } else {
        console.log(
          `[sendHandler] [${new Date().toISOString()}] - [FDC] - receiver is an id.`
        );
        receiverFid = receiver;
      }

      const message: MessageWithFarcasterIdBody = {
        text,
        farcasterId: receiverFid,
        id: `${sender}-${receiver}-${Date.now()}`,
        sender,
      };

      jobsToRun.push(addToDCsQueue(message));
    }

    if (channels.includes(ChannelService.XMTP)) {
      // add xmtp message to queue
      console.log(
        `[sendHandler] [${new Date().toISOString()}] - [XMTP] - send a message using xmtp.`
      );
      let recipientAddress: string;
      if (typeof receiver !== "string") {
        console.log(
          `[sendHandler] [${new Date().toISOString()}] - [XMTP] - receiver is a farcaster fid.`
        );
        const user = await getFarcasterUsersByFid(receiver);
        if (!user) {
          console.log(
            `[sendHandler] [${new Date().toISOString()}] - [XMTP] - recipient not found.`
          );
          return res
            .status(400)
            .send({ status: "nok", error: "recipient not found" });
        }
        recipientAddress =
          user.verified_addresses.eth_addresses[0] || user.custody_address;
      } else {
        console.log(
          `[sendHandler] [${new Date().toISOString()}] - [XMTP] - receiver is an address.`
        );
        recipientAddress = receiver;
      }

      const message: MessageWithRecipientBody = {
        text,
        recipient: recipientAddress,
        id: `${sender}-${recipientAddress}-${Date.now()}`,
      };

      jobsToRun.push(addToXMTPQueue(message));
    }

    await Promise.all(jobsToRun);

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
