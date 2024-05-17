import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { env } from "../env";
import { EmbeddedCast } from "@neynar/nodejs-sdk/build/neynar-api/v2";

const SIGNER_UUID = env.FARCASTER_SIGNER_UUID as string;
const client = new NeynarAPIClient(env.FARCASTER_API_KEY as string);

/**
 * @dev this function publishes a cast to the given farcaster channel
 * @param {string} text the text of the cast to publish
 * @param options the options to pass to Neynar
 * @returns {string} hash of the newly created cast
 */
export const publishCast = async (
  text: string,
  options?: { embeds?: EmbeddedCast[]; channelId: string }
) => {
  const { hash } = await client.publishCast(SIGNER_UUID, text, options);

  return hash;
};

/**
 * @dev this function sends a direct cast to the given recipient
 * @param {string} text the text of the cast to send
 * @param {number} recipient farcaster id of the recipient
 */
// @ts-ignore
export const sendDirectCast = async (recipient: number, text: string) => {};

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
