import { NextFunction, Request, Response } from "express";
import z, { ZodError } from "zod";

/**
 * @dev validates the request body against the provided schema and returns a middleware
 * @param {z.ZodObject} schema the zod schema to validate the request body against
 * @returns a valid express middleware that checks for error in the input data
 */
export const validateSchema = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        res
          .status(400)
          .json({ error: "invalid input data", details: errorMessages });
      } else {
        res.status(500).json({ error: "internal server error" });
      }
    }
  };
};
