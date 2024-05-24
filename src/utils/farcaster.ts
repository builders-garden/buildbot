import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { env } from "../env.js";
import { EmbeddedCast } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import ky from "ky";
import { v4 as uuidv4 } from "uuid";

const SIGNER_UUID = env.FARCASTER_SIGNER_UUID as string;
const client = new NeynarAPIClient(env.FARCASTER_API_KEY as string);

/**
 * @dev this function publishes a cast to the given farcaster channel
 * @param {string} text the text of the cast to publish
 * @param options the options to pass to Neynar
 * @returns {Promise<string>} hash of the newly created cast
 */
export const publishCast = async (
  text: string,
  options?: { embeds?: EmbeddedCast[]; channelId?: string, replyTo?: string}
) => {
  const { hash } = await client.publishCast(SIGNER_UUID, text, options);

  return hash;
};

/**
 * @dev this function sends a direct cast to the given recipient
 * @param {string} text the text of the cast to send
 * @param {number} recipient farcaster id of the recipient
 */
export const sendDirectCast = async (recipient: number, text: string) => {
  if (!env.FARCASTER_API_KEY) {
    console.log("No FARCASTER_API_KEY found, skipping direct cast send.");
    return;
  }

  const {
    result: { success },
  } = await ky
    .post("https://api.warpcast.com/v2/ext-send-direct-cast", {
      headers: {
        Authorization: `Bearer ${env.FARCASTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      json: {
        recipientFid: recipient,
        message: text,
        idempotencyKey: uuidv4(),
      },
    })
    .json<{ result: { success: boolean } }>();

  if (!success) {
    console.error(`error sending direct cast to ${recipient}.`);
  }
};

/**
 * @dev this function returns the custody address from a farcaster username
 * @param {string} username the username of the farcasteruser
 * @returns {string} custody address of the user
 */
export const getAddressFromUsername = async (username: string) => {
  const {
    result: {
      user: { custodyAddress },
    },
  } = await client.lookupUserByUsername(username);

  return custodyAddress;
};

/**
 * @dev returns the farcaster users by their ethereum addresses
 * @param {string[]} addresses the ethereum addresses to lookup
 * @returns list of farcaster users
 */
export const getFarcasterUsersByAddresses = async (addresses: string[]) =>
  await client.fetchBulkUsersByEthereumAddress(addresses);

/**
 * @dev this function returns the usernames from farcaster ids
 * @param {number[]} farcasterIds the farcaster ids to lookup
 * @returns {Promise<{nominator: string, nominee: string}>} the usernames of the nominator and nominee
 */
export const getUsernamesFromIds = async (farcasterIds: number[]) => {
  const { users } = await client.fetchBulkUsers(farcasterIds);

  const nominator = users.find((user) => user.fid === farcasterIds[0]);
  const nominee = users.find((user) => user.fid === farcasterIds[1]);

  return { nominator: nominator!.username, nominee: nominee!.username };
};
