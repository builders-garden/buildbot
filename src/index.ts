import { env } from "./env.js";
import express from "express";
import { utilsRouter, webhooksRouter } from "./routes/index.js";
import { startJobs } from "./jobs/index.js";

export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use("/", utilsRouter);
app.use("/webhooks", webhooksRouter);

app.listen(env.PORT, () => {
  console.log(`⚡️ buildbot running on port ${env.PORT}`);
  startJobs();
});
