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
import { isSubscribed } from "../../utils/redis.js";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("sendHandler");

export const sendHandler = async (req: Request, res: Response) => {
  try {
    const { text, sender, receiver, channels }: MessageBody = req.body;

    logger.log(`new message request received.`);

    const jobsToRun: Promise<void>[] = [];

    if (channels.includes(ChannelService.FarcasterDC)) {
      logger.log(`- [FDC] - send a message using farcaster direct casts.`);
      let receiverFid: number;
      // check if receiver is an address or a fid
      if (typeof receiver === "string") {
        logger.log(`receiver is an address.`);
        const users = await getFarcasterUsersByAddresses([receiver]);
        const receiverUser = users[receiver.toLowerCase()];
        if (!receiverUser) {
          logger.error(`- [FDC] - receiver not found.`);
          return res
            .status(400)
            .send({ status: "nok", error: "receiver not found" });
        }
        receiverFid = receiverUser[0].fid;
      } else {
        logger.log(`- [FDC] - receiver is a farcaster fid.`);
        receiverFid = receiver;
      }

      // check if the receiver is subscribed to this comunication channel
      if (await isSubscribed(ChannelService.FarcasterDC, receiverFid, sender)) {
        logger.log(`- [FDC] - receiver is subscribed.`);
        const message: MessageWithFarcasterIdBody = {
          text,
          farcasterId: receiverFid,
          id: `${sender}-${receiver}-${Date.now()}`,
          sender,
        };

        jobsToRun.push(addToDCsQueue(message));
      } else {
        logger.log(
          `- [FDC] - receiver is not subscribed. Skip sending message.`
        );
      }
    }

    if (channels.includes(ChannelService.XMTP)) {
      // add xmtp message to queue
      logger.log(`- [XMTP] - send a message using xmtp.`);
      let recipientAddress: string;
      if (typeof receiver !== "string") {
        logger.log(`- [XMTP] - receiver is a farcaster fid.`);
        const user = await getFarcasterUsersByFid(receiver);
        if (!user) {
          logger.error(`- [XMTP] - recipient not found.`);
          return res
            .status(400)
            .send({ status: "nok", error: "recipient not found" });
        }
        recipientAddress =
          user.verified_addresses.eth_addresses[0] || user.custody_address;
      } else {
        logger.log(`- [XMTP] - receiver is an address.`);
        recipientAddress = receiver;
      }

      if (await isSubscribed(ChannelService.XMTP, recipientAddress, sender)) {
        logger.log(`- [XMTP] - recipient is subscribed.`);
        const message: MessageWithRecipientBody = {
          text,
          recipient: recipientAddress,
          id: `${sender}-${recipientAddress}-${Date.now()}`,
          sender,
        };

        jobsToRun.push(addToXMTPQueue(message));
      } else {
        logger.log(
          `- [XMTP] - recipient is not subscribed. Skip sending message.`
        );
      }
    }

    await Promise.all(jobsToRun);

    return res.status(200).send({ status: "ok", body: req.body });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`error sending message: ${error.message}.`);
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};
