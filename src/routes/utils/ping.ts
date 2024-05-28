import { Request, Response } from "express";

export const pingHandler = async (_: Request, res: Response) =>
  res.status(200).send({ result: "pong" });
