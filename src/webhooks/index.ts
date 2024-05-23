import express from "express";
import { mentionsHandler } from "./mentions.js";
import { mentionsSchema } from "../schemas.js";
import { webhookKeyMiddleware } from "../middlewares.js";
import { validateSchema } from "../validators.js";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/mentions",
  webhookKeyMiddleware,
  validateSchema(mentionsSchema),
  mentionsHandler
);

export default webhooksRouter;
