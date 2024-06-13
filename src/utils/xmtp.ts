import { env } from "../env.js";
import { Client } from "@xmtp/xmtp-js";
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { Wallet } from "ethers";
import { TalentProtocolSender } from "../schemas.js";

/**
 * @dev this function creates a new xmtp client
 * @returns {Client} the new xmtp client
 */
const createXMTPClient = async (
  sender: TalentProtocolSender = TalentProtocolSender.BUILDBOT
) => {
  let wallet: Wallet;

  switch (sender) {
    case TalentProtocolSender.BUILDBOT:
      wallet = new Wallet(env.BUILDBOT_XMTP_PRIVATE_KEY);
      break;
    case TalentProtocolSender.TALENTBOT:
      wallet = new Wallet(env.TALENTBOT_XMTP_PRIVATE_KEY);
      break;
    default:
      throw new Error(`sender ${sender} not supported.`);
  }

  const client = await Client.create(wallet, {
    env: process.env.XMTP_ENV as any,
    apiClientFactory: GrpcApiClient.fromOptions,
  });

  return client;
};

/**
 * @dev this function sends a xmtp message to the given recipient
 * @param {string} recipient wallet address of the recipient
 * @param {string} text the text of the message to send
 */
export const sendXMTPMessage = async (
  recipient: string,
  text: string,
  sender: TalentProtocolSender = TalentProtocolSender.BUILDBOT
) => {
  const client = await createXMTPClient(sender);

  const conversations = await client.conversations.list();
  const conversation = conversations.find((c) => c.peerAddress === recipient);

  if (conversation) {
    // send the message to the conversation
    await conversation.send(text);
  } else {
    // create new conversation
    const canMessage = await client.canMessage(recipient);
    if (!canMessage) {
      throw new Error(`${recipient} cannot be messaged.`);
    }
    const newConversation = await client.conversations.newConversation(
      recipient
    );
    await newConversation.send(text);
  }
};
