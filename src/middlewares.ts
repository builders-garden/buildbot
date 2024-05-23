import { NextFunction, Request, Response } from "express";
import { env } from "./env.js";

/**
 * @dev simple middleware that checks for the presence of the x-webhook-key header
 * @param {Request} req input express request
 * @param {Response} res output express response
 * @param {NextFunction} next express next function
 */
export const webhookKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const webhookKey = req.header("x-webhook-key");
  if (!webhookKey || webhookKey !== env.WEBHOOK_KEY) {
    res.status(401).send("Unauthorized");
    return;
  }
  next();
};
