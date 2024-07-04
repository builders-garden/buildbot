import Cron from "croner";
import { env } from "../env.js";
import { sendDirectCast } from "../utils/index.js";
import {
  MessageWithFarcasterIdBody,
  // MessageWithRecipientBody,
  // NewRemindersBody,
  // RemindersBody,
} from "../schemas.js";
// import ky from "ky";

// this job runs every wednesday
export const runReminderJob = () =>
  // edit the REMINDER_CRON env variable to run the job on a different schedules
  Cron(env.REMINDER_CRON, async () => {
    console.log(`[reminder job] [${Date.now()}] - running job`);
    // call the TP API endpoints
    // const reminders = await ky
    //   .get(`${env.BUILD_API_URL}/reminders`, {
    //     headers: {
    //       "x-webhook-key": env.WEBHOOK_KEY,
    //       accept: "application/json",
    //     },
    //   })
    //   .json<NewRemindersBody>();
    const reminders = [
      {
        nominationsBudget: 15410.36267426816,
        nominationsSent: 9,
        farcasterId: 189636,
        username: "bianc8",
        wallet: "0x699d04f9994f181f3e310f70cf6ac8e8445ace9a",
      },
    ];

    // build the messages
    // const xmtpMessages: MessageWithRecipientBody[] = [];
    const directMessages: MessageWithFarcasterIdBody[] = [];

    for (const reminder of reminders) {
      const {
        // nominationsSent,
        nominationsBudget,
        farcasterId,
        // wallet,
      } = reminder;
      const text = `Today is the last day to nominate your favorite builder(s) of the past week. Don't waste the ${nominationsBudget} BUILD points you can give someone.`;

      directMessages.push({
        id: `reminder-${Date.now()}-dc-${farcasterId}`,
        farcasterId,
        text,
      });
    }

    // send the messages
    // we use direct for loops and not Promise.all to avoid possible rate limiting
    // for (const message of xmtpMessages) {
    //   try {
    //     await sendXMTPMessage(message.recipient, message.text);
    //   } catch (error) {
    //     console.error(
    //       `[reminder job] [${Date.now()}] - error sending xmtp message to ${
    //         message.recipient
    //       }`,
    //       error
    //     );
    //   }
    // }

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
