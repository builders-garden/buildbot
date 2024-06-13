import express from "express";
import { sendHandler } from "./send.js";
import { validateBodySchema } from "../../validators.js";
import { messageSchema, subscriberSchema } from "../../schemas.js";
import { subscribeHandler, unsubscribeHandler } from "./subscribe.js";

const messagesRouter = express.Router();

messagesRouter.post("/", validateBodySchema(messageSchema), sendHandler);
messagesRouter.post(
  "/subscribe",
  validateBodySchema(subscriberSchema),
  subscribeHandler
);
messagesRouter.post(
  "/unsubscribe",
  validateBodySchema(subscriberSchema),
  unsubscribeHandler
);

export { messagesRouter };
