import express from "express";
import { pingHandler } from "./ping.js";
import { metricsHandler } from "./metrics.js";

const utilsRouter = express.Router();

utilsRouter.get("/metrics", metricsHandler);
utilsRouter.get("/ping", pingHandler);

export { utilsRouter };
