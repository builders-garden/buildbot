import Cron from "croner";
import { env } from "../env";
import { MessageWithRecipientBody, WeeklyStatsBody } from "../schemas";
import { sendDirectCast, sendXMTPMessage } from "../utils";
import ky from "ky";

// this job runs every sunday
export const runWeeklyStatsJob = () =>
  // edit the WEEKLY_STATS_CRON env variable to run the job on a different schedules
  Cron(env.WEEKLY_STATS_CRON, async () => {
    console.log(`[weekly-stats job] [${Date.now()}] - running job`);
    // call the TP API endpoints
    const reminders = await ky
      .get(`${env.BUILD_API_URL}/weekly-stats`, {
        headers: {
          "x-webhook-key": env.WEBHOOK_KEY,
          accept: "application/json",
        },
      })
      .json<WeeklyStatsBody>();

    // build the messages
    const xmtpMessages: MessageWithRecipientBody[] = [];
    const directMessages: MessageWithRecipientBody[] = [];

    for (const reminder of reminders) {
      const {
        nominationsSent,
        nominationsReceived,
        earnedPoints,
        wallets,
        farcasterUsername,
      } = reminder;
      const text = `This week you received ${nominationsReceived} nominations, nominated ${nominationsSent} builders, and earned ${earnedPoints} BUILD points.`;

      for (const wallet of wallets) {
        xmtpMessages.push({
          recipient: wallet,
          text,
        });
      }

      directMessages.push({
        recipient: farcasterUsername,
        text,
      });
    }

    // send the messages
    // we use direct for loops and not Promise.all to avoid parallelism and possible rate limiting
    for (const message of xmtpMessages) {
      try {
        await sendXMTPMessage(message.recipient, message.text);
      } catch (error) {
        console.error(
          `[reminder job] [${Date.now()}] - error sending xmtp message to ${
            message.recipient
          }`,
          error
        );
      }
    }

    for (const message of directMessages) {
      try {
        await sendDirectCast(message.recipient, message.text);
      } catch (error) {
        console.error(
          `[reminder job] [${Date.now()}] - error sending direct message to ${
            message.recipient
          }`,
          error
        );
      }
    }

    console.log(`[weekly-stats job] [${Date.now()}] - job finished.`);
  });
