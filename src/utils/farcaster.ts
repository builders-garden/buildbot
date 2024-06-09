import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { env } from "../env.js";
import {
  CastParamType,
  EmbeddedCast,
  User,
} from "@neynar/nodejs-sdk/build/neynar-api/v2";
import ky from "ky";
import { v4 as uuidv4 } from "uuid";

const SIGNER_UUID = env.FARCASTER_SIGNER_UUID as string;
const client = new NeynarAPIClient(env.FARCASTER_API_KEY as string);

export const setupWebhook = async () => {
  return await client.publishWebhook(
    "builbot-nominations-webhook",
    `https://buildbot-api.talentprotocol.com/webhooks/nominations`,
    {
      subscription: {
        "cast.created": {
          mentioned_fids: [531162],
        },
      },
    }
  );
};

/**
 * @dev this function publishes a cast to the given farcaster channel
 * @param {string} text the text of the cast to publish
 * @param options the options to pass to Neynar
 * @returns {Promise<string>} hash of the newly created cast
 */
export const publishCast = async (
  text: string,
  options?: { embeds?: EmbeddedCast[]; channelId?: string; replyTo?: string }
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
    .put("https://api.warpcast.com/v2/ext-send-direct-cast", {
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
export const getFarcasterUsersByAddresses = async (
  addresses: string[]
): Promise<{ [key: string]: User[] | undefined }> => {
  try {
    // return await ky
    // .get(
    //   `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses
    //     .map((a: string) => a.trim().toLowerCase())
    //     .join(",")}`,
    //   {
    //     headers: {
    //       accept: "application/json",
    //       api_key: env.FARCASTER_API_KEY,
    //     },
    //   }
    // )
    // .json<{ [key: string]: User[] }>();
    return await client.fetchBulkUsersByEthereumAddress(addresses);
  } catch (error) {
    console.log(`error when calling neynar for addresses: ${addresses}`);
    const users: { [key: string]: User[] | undefined } = {};
    addresses.forEach((address) => {
      users[address] = undefined;
    });
    return users;
  }
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

/**
 * @dev this function returns true if the input address is the custody address or a verified address of the user
 * @param {User} user neynar user
 * @param {string} inputAddress address coming from build
 * @returns true if the user is correct, false otherwise
 */
export const isCorrectUser = (user: User, inputAddress: string) => {
  if (!user.custody_address || !user.verified_addresses) {
    return false;
  }

  if (user.custody_address.toLowerCase() === inputAddress.toLowerCase()) {
    return true;
  }

  const hasVerifiedAddress = user.verified_addresses.eth_addresses.some(
    (a: string) => a.toLowerCase() === inputAddress.toLowerCase()
  );
  return hasVerifiedAddress;
};

/**
 * @dev this function returns the cast from a hash
 * @param {string} castHash the hash of the cast
 * @returns farcaster cast with the given hash, or undefined
 */
export const getCastFromHash = async (castHash: string) => {
  return await client.lookUpCastByHashOrWarpcastUrl(
    castHash,
    CastParamType.Hash
  );
};
