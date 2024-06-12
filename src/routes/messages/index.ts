import express from "express";
import { sendHandler } from "./send.js";
import { validateSchema } from "../../validators.js";
import { messageSchema } from "../../schemas.js";
import { unsubscribeHandler } from "./unsubscribe.js";

const messagesRouter = express.Router();

messagesRouter.post("/", validateSchema(messageSchema), sendHandler);
messagesRouter.post("/unsubscribe", unsubscribeHandler);

export { messagesRouter };
