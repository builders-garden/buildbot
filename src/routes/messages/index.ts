import express from "express";
import { sendHandler } from "./send.js";
import { validateBodySchema } from "../../validators.js";
import { messageSchema, subscriberSchema } from "../../schemas.js";
import {
  isSubscribedHandler,
  subscribeHandler,
  unsubscribeHandler,
} from "./subscribe.js";
import { genericKeyMiddleware } from "../../middlewares.js";

const messagesRouter = express.Router();

messagesRouter.post(
  "/",
  genericKeyMiddleware,
  validateBodySchema(messageSchema),
  sendHandler
);
messagesRouter.post(
  "/subscribe",
  genericKeyMiddleware,
  validateBodySchema(subscriberSchema),
  subscribeHandler
);
messagesRouter.post(
  "/unsubscribe",
  genericKeyMiddleware,
  validateBodySchema(subscriberSchema),
  unsubscribeHandler
);
messagesRouter.get("/is-subscribed", genericKeyMiddleware, isSubscribedHandler);

export { messagesRouter };
