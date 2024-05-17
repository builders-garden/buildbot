import { env } from "../env";
import { Client } from "@xmtp/xmtp-js";
import { GrpcApiClient } from "@xmtp/grpc-api-client";
import { Wallet } from "ethers";

/**
 * @dev this function creates a new xmtp client
 * @returns {Client} the new xmtp client
 */
const createXMTPClient = async () => {
  const wallet = new Wallet(env.XMTP_PRIVATE_KEY);

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
export const sendXMTPMessage = async (recipient: string, text: string) => {
  const client = await createXMTPClient();

  const conversations = await client.conversations.list();
  const conversation = conversations.find((c) => c.peerAddress === recipient);

  if (conversation) {
    // send the message to the conversation
    await conversation.send(text);
  } else {
    // create new conversation
    const newConversation = await client.conversations.newConversation(
      recipient
    );
    await newConversation.send(text);
  }
};
