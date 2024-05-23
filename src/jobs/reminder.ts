import Cron from "croner";
import { env } from "../env.js";
import { sendDirectCast, sendXMTPMessage } from "../utils/index.js";
import {
  MessageWithFarcasterIdBody,
  MessageWithRecipientBody,
  RemindersBody,
} from "../schemas.js";
import ky from "ky";

// this job runs every wednesday
export const runReminderJob = () =>
  // edit the REMINDER_CRON env variable to run the job on a different schedules
  Cron(env.REMINDER_CRON, async () => {
    console.log(`[reminder job] [${Date.now()}] - running job`);
    // call the TP API endpoints
    const reminders = await ky
      .get(`${env.BUILD_API_URL}/reminders`, {
        headers: {
          "x-webhook-key": env.WEBHOOK_KEY,
          accept: "application/json",
        },
      })
      .json<RemindersBody>();

    // build the messages
    const xmtpMessages: MessageWithRecipientBody[] = [];
    const directMessages: MessageWithFarcasterIdBody[] = [];

    for (const reminder of reminders) {
      const {
        nominationsSent,
        nominationsBudget,
        wastedPoints,
        wallets,
        farcasterId,
      } = reminder;
      const text = `This week you nominated ${nominationsSent} builders, out of ${nominationsBudget} possible. You wasted ${wastedPoints} BUILD points you could have gifted someone.`;

      for (const wallet of wallets) {
        xmtpMessages.push({
          recipient: wallet,
          text,
        });
      }

      directMessages.push({
        farcasterId,
        text,
      });
    }

    // send the messages
    // we use direct for loops and not Promise.all to avoid possible rate limiting
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
        await sendDirectCast(message.farcasterId, message.text);
      } catch (error) {
        console.error(
          `[reminder job] [${Date.now()}] - error sending direct message to ${
            message.farcasterId
          }`,
          error
        );
      }
    }

    console.log(`[reminder job] [${Date.now()}] - job completed`);
  });
