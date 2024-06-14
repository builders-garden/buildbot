import { env } from "./env.js";
import express from "express";
import { messagesRouter, utilsRouter, webhooksRouter } from "./routes/index.js";
import { startJobs } from "./jobs/index.js";
import slowDown from "express-slow-down";
import { setupWebhook } from "./utils/farcaster.js";

export const app = express();

const apiLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 200, // Allow only 200 requests per minute to go at full speed.
  delayMs: (_) => 1000, // Slow down each request after the limit by 1 second.
  validate: { xForwardedForHeader: false },
});

app.use(express.json({ limit: "10mb" }));
app.use(apiLimiter);
app.use("/", utilsRouter);
app.use("/webhooks", webhooksRouter);
app.use("/messages", messagesRouter);

app.listen(env.PORT, async () => {
  console.log(`⚡️ buildbot running on port ${env.PORT}`);
  startJobs();
  await setupWebhook();
  console.log(`🎣 neynar webhook setup complete.`);
});
