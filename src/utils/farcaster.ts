import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { env } from "../env.js";
import {
  CastParamType,
  EmbeddedCast,
  User,
} from "@neynar/nodejs-sdk/build/neynar-api/v2/index.js";
import ky from "ky";
import { v4 as uuidv4 } from "uuid";
import { TalentProtocolSender } from "../schemas.js";
import { Logger } from "./logger.js";

const SIGNER_UUID = env.FARCASTER_SIGNER_UUID as string;
const client = new NeynarAPIClient(env.FARCASTER_API_KEY as string);

const webhookName = env.BUILDBOT_WEBHOOK_NAME;
const webhookUrl =
  env.BUILDBOT_WEBHOOK_TARGET_BASE_URL + "/webhooks/nominations";
// const buildbotFid = env.BUILDBOT_FARCASTER_FID as number;

const logger = new Logger("farcaster");

export const setupWebhook = async () => {
  const createdWebhooks = await client.fetchWebhooks();
  const webhook = createdWebhooks.webhooks.find(
    (webhook) =>
      webhook.title === webhookName && webhook.target_url === webhookUrl
  );
  if (webhook) {
    logger.log(
      `webhook already exists, using webhook with id ${webhook.webhook_id} and title ${webhook.title}`
    );
    return {
      success: true,
      message: "webhook already exists",
      webhook,
    };
  }
  throw new Error(
    "webhook does not exist - please create a new webhook before continuing."
  );

  // logger.log("webhook does not exist - creating new webhook");
  // return await client.publishWebhook(webhookName, webhookUrl, {
  //   subscription: {
  //     "cast.created": {
  //       mentioned_fids: [buildbotFid],
  //     },
  //   },
  // });
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
export const sendDirectCast = async (
  recipient: number,
  text: string,
  sender: TalentProtocolSender = TalentProtocolSender.BUILDBOT
) => {
  let apiKey: string | undefined;
  if (sender === TalentProtocolSender.BUILDBOT) {
    if (!env.BUILDBOT_WARPCAST_API_KEY) {
      logger.error(
        "No BUILDBOT_WARPCAST_API_KEY found, skipping direct cast send."
      );
      throw new Error("No BUILDBOT_WARPCAST_API_KEY found.");
    }
    logger.log("sending direct cast as buildbot");
    apiKey = env.BUILDBOT_WARPCAST_API_KEY;
  }

  if (sender === TalentProtocolSender.TALENTBOT) {
    if (!env.TALENTBOT_WARPCAST_API_KEY) {
      logger.error(
        "No TALENTBOT_WARPCAST_API_KEY found, skipping direct cast send."
      );
      throw new Error("No TALENTBOT_WARPCAST_API_KEY found.");
    }
    logger.log("sending direct cast as talentbot");
    apiKey = env.TALENTBOT_WARPCAST_API_KEY;
  }

  if (apiKey === undefined) {
    logger.error("No API key found, skipping direct cast send.");
    throw new Error("No API key found.");
  }

  const {
    result: { success },
  } = await ky
    .put("https://api.warpcast.com/v2/ext-send-direct-cast", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    logger.error(`error sending direct cast to ${recipient}.`);
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
    logger.log(`error when calling neynar for addresses: ${addresses}`);
    const users: { [key: string]: User[] | undefined } = {};
    addresses.forEach((address) => {
      users[address] = undefined;
    });
    return users;
  }
};

/**
 * @dev this function returns a farcaster user by their farcaster id
 * @param {number} fid the farcaster id to lookup
 * @returns {Promise<User | undefined>} the user with the given farcaster id, or undefined
 */
export const getFarcasterUsersByFid = async (fid: number) => {
  const { users } = await client.fetchBulkUsers([fid]);
  if (users.length === 0) {
    return undefined;
  }
  return users[0];
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
