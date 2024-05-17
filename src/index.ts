import { env } from "./env";
import express from "express";
import webhooksRouter from "./webhooks";
import { startJobs } from "./jobs";

export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use("/webhooks", webhooksRouter);

app.listen(env.PORT, () => {
  console.log(`⚡️ buildbot running on port ${env.PORT}`);
  startJobs();
});
