import express from "express";
import { mentionsHandler } from "./mentions";
import { mentionsSchema } from "../schemas";
import { webhookKeyMiddleware } from "../middlewares";
import { validateSchema } from "../validators";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/mentions",
  webhookKeyMiddleware,
  validateSchema(mentionsSchema),
  mentionsHandler
);

export default webhooksRouter;
