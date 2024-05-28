import { env } from "./env.js";
import express from "express";
import { utilsRouter, webhooksRouter } from "./routes/index.js";
import { startJobs } from "./jobs/index.js";
import slowDown from "express-slow-down";

export const app = express();

const apiLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 200, // Allow only 200 requests per minute to go at full speed.
  delayMs: (_) => 5000, // Slow down each request after the limit by 1 second.
});

app.use(express.json({ limit: "10mb" }));
app.use(apiLimiter);
app.use("/", utilsRouter);
app.use("/webhooks", webhooksRouter);

app.listen(env.PORT, () => {
  console.log(`⚡️ buildbot running on port ${env.PORT}`);
  startJobs();
});
