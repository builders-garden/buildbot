import { Request, Response } from "express";

export const unsubscribeHandler = async (req: Request, res: Response) => {
  try {
    const { query } = req;

    console.log(
      `[unsubscribeHandler] [${new Date().toISOString()}] - new message received.`
    );

    return res.status(200).send({ status: "ok", query });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[unsubscribeHandler] [${new Date().toISOString()}] - error sending message: ${
          error.message
        }.`
      );
      return res.status(200).send({ status: "nok" });
    }
    throw error;
  }
};
