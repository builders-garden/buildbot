import { runReminderJob } from "./reminder";
import { runWeeklyStatsJob } from "./weekly-stats";

/**
 * @dev starts all the background jobs after the express app has started.
 */
export const startJobs = () => {
  console.log("starting background jobs...");
  runReminderJob();
  console.log("reminder job started.");
  runWeeklyStatsJob();
  console.log("weekly stats job started.");
};
