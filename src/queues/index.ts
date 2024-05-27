import {
  MessageBody,
  MessageWithFarcasterIdBody,
  MessageWithRecipientBody,
} from "../schemas.js";
import { castsQueue, processCast } from "./casts.js";
import { dcsQueue, processDC } from "./dcs.js";
import { xmtpQueue, processXMTPMessage } from "./xmtp.js";

const CASTS_JOB_NAME = "create-cast";
const DCS_JOB_NAME = "create-dc";
const XMTP_JOB_NAME = "send-xmtp-message";

export const addToCastsQueue = async (data: MessageBody) => {
  if (castsQueue) {
    await castsQueue.add(CASTS_JOB_NAME, data);
    return;
  }
  await processCast({ data });
};

export const addToDCsQueue = async (data: MessageWithFarcasterIdBody) => {
  if (dcsQueue) {
    await dcsQueue.add(DCS_JOB_NAME, data);
    return;
  }
  await processDC({ data });
};

export const addToXMTPQueue = async (data: MessageWithRecipientBody) => {
  if (xmtpQueue) {
    await xmtpQueue.add(XMTP_JOB_NAME, data);
    return;
  }
  await processXMTPMessage({ data });
};
