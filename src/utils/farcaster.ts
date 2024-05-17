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
 * @param {string} recipient username of the recipient of the cast
 */
// @ts-ignore
export const sendDirectCast = async (text: string, recipient: string) => {};

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
