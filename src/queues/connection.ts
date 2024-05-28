import { env } from "../env.js";

export const redisConnection = {
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: env.REDIS_PORT,
  enableOfflineQueue: false,
};
