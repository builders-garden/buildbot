import { Request, Response } from "express";
import {
  addSubscriber,
  getSubscriber,
  removeSubscriber,
} from "../../utils/redis.js";
import { SubscriberParams } from "../../schemas.js";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("subscribeHandler");

export const subscribeHandler = async (req: Request, res: Response) => {
  try {
    const { channel, fid, address, sender }: SubscriberParams = req.body;

    logger.log(`new subscription received.`);

    const subscriberId = fid || address;

    if (!subscriberId) {
      logger.error(`missing fid or address.`);
      return res.status(400).send({ status: "nok" });
    }

    const subscription = await addSubscriber(channel, subscriberId, sender, {
      fid: fid ? fid : undefined,
      address: address ? address : undefined,
    });

    logger.log(`subscription added.`);

    return res.status(200).send({ status: "ok", subscription });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`error during subscription: ${error.message}.`);
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};

export const unsubscribeHandler = async (req: Request, res: Response) => {
  try {
    const { channel, fid, address, sender }: SubscriberParams = req.body;

    logger.log(`new unsubscribe request received.`);

    if (!channel) {
      logger.error(`missing channel.`);
      return res.status(400).send({ status: "nok" });
    }

    const subscriberId = fid || address;

    if (!subscriberId) {
      logger.error(`missing fid or address.`);
      return res.status(400).send({ status: "nok" });
    }

    const unsubscription = await getSubscriber(channel, subscriberId, sender);
    if (unsubscription) {
      await removeSubscriber(channel, subscriberId, sender);
    }

    return res.status(200).send({ status: "ok", unsubscription });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`error sending message: ${error.message}.`);
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};

export const isSubscribedHandler = async (req: Request, res: Response) => {
  try {
    const { channel, fid, address, sender }: SubscriberParams = req.body;

    logger.log(`new subscription check request received.`);

    if (!channel) {
      logger.error(`missing channel.`);
      return res.status(400).send({ status: "nok" });
    }

    const subscriberId = fid || address;

    if (!subscriberId) {
      logger.error(`missing fid or address.`);
      return res.status(400).send({ status: "nok" });
    }

    const isSubscribed = await getSubscriber(channel, subscriberId, sender);

    return res.status(200).send({ status: "ok", isSubscribed });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`error sending message: ${error.message}.`);
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};
