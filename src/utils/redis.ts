import { createClient } from "redis";
import { env } from "../env.js";
import { TalentProtocolSender } from "../schemas.js";

const redisConfig = {
  url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
};

const redisClient = await createClient(
  env.REDIS_HOST === "0.0.0.0" ? redisConfig : undefined
)
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export type Subscriber = {
  fid?: number;
  address?: string;
  createdAt?: number;
  sender?: TalentProtocolSender;
};

export const addSubscriber = async (
  channel: string,
  subscriverId: string | number,
  sender: string,
  subscriber: Subscriber
) => {
  subscriber.createdAt = Date.now();
  subscriber.sender = sender as TalentProtocolSender;
  await redisClient.set(
    `${channel}-${sender}-${subscriverId}`,
    JSON.stringify(subscriber)
  );
  return subscriber;
};

export const removeSubscriber = async (
  channel: string,
  subscriberId: string | number,
  sender: string
) => {
  await redisClient.del(`${channel}-${sender}-${subscriberId}`);
};

export const getSubscriber = async (
  channel: string,
  subscriberId: string | number,
  sender: string
): Promise<Subscriber | undefined> => {
  const subscriber = await redisClient.get(
    `${channel}-${sender}-${subscriberId}`
  );
  return subscriber ? JSON.parse(subscriber) : undefined;
};

export const isSubscribed = async (
  channel: string,
  subscriberId: string | number,
  sender: string
): Promise<boolean> => {
  return !!(await getSubscriber(channel, subscriberId, sender));
};
