import {
  MessageBody,
  MessageWithFarcasterIdBody,
  MessageWithRecipientBody,
} from "../schemas";
import { castsQueue, processCast } from "./casts";
import { dcsQueue, processDC } from "./dcs";
import { xmtpQueue, processXMTPMessage } from "./xmtp";

const CASTS_JOB_NAME = "create-cast";
const DCS_JOB_NAME = "create-dc";
const XMTP_JOB_NAME = "send-xmtp-message";

export const addToCastsQueue = async (data: MessageBody) => {
  try {
    await castsQueue.add(CASTS_JOB_NAME, data);
  } catch (error) {
    await processCast({ data });
  }
};

export const addToDCsQueue = async (data: MessageWithFarcasterIdBody) => {
  try {
    await dcsQueue.add(DCS_JOB_NAME, data);
  } catch (error) {
    await processDC({ data });
  }
};

export const addToXMTPQueue = async (data: MessageWithRecipientBody) => {
  try {
    await xmtpQueue.add(XMTP_JOB_NAME, data);
  } catch (error) {
    await processXMTPMessage({ data });
  }
};
