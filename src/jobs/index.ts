import { env } from "../env.js";
import { runReminderJob } from "./reminder.js";
import { runWeeklyStatsJob } from "./weekly-stats.js";

/**
 * @dev starts all the background jobs after the express app has started.
 */
export const startJobs = () => {
  if (!env.ENABLE_JOBS) {
    console.log("jobs are disabled.");
    return;
  }
  console.log("starting background jobs...");
  runReminderJob();
  console.log("reminder job started.");
  runWeeklyStatsJob();
  console.log("weekly stats job started.");
};
