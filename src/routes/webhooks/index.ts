import express from "express";
import { mentionsHandler } from "./mentions.js";
import { nominationsHandler } from "./nominations.js";
import { mentionsSchema } from "../../schemas.js";
import { webhookKeyMiddleware } from "../../middlewares.js";
import { validateBodySchema } from "../../validators.js";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/mentions",
  webhookKeyMiddleware,
  validateBodySchema(mentionsSchema),
  mentionsHandler
);

webhooksRouter.post("/nominations", nominationsHandler);

export { webhooksRouter };
