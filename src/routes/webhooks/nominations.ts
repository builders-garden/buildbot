import { Request, Response } from "express";
import ky, { HTTPError } from "ky";
import { getCastFromHash } from "../../utils/farcaster.js";
import { addToRepliesQueue } from "../../queues/index.js";
import { env } from "../../env.js";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("nominationsHandler");
const regexPattern = /@buildbot\s+(nom(?:inate)?)\s*(?:@\w+)?\b/g;

type Nomination = {
  id: number;
  buildPointsReceived: number;
  buildPointsSent: number;
  originUserId: string;
  originUsername: string;
  originWallet: string;
  originRank: number | null;
  destinationWallet: string;
  destinationUsername: string;
  destinationRank: number | null;
  createdAt: string;
};

type NominationResult =
  | {
      ok: true;
      nomination: Nomination;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

const createNomination = async (
  originWallet: string,
  walletToNominate: string,
  castId?: string
): Promise<NominationResult> => {
  // send the request to the build API
  try {
    logger.log(
      `sending nomination with origin_wallet: ${originWallet}, destination_wallet: ${walletToNominate}, cast_id: ${castId}.`
    );
    const result = await ky.post("https://build.top/api/nominations", {
      headers: {
        "X-API-KEY": env.WEBHOOK_KEY,
      },
      json: {
        destination_wallet: walletToNominate,
        origin_wallet: originWallet,
        cast_id: castId,
      },
    });
    const nomination: Nomination = await result.json();
    logger.log(`nomination result - ${JSON.stringify(nomination)}`);
    return {
      ok: true,
      nomination,
    };
  } catch (error) {
    if (error instanceof HTTPError && error.name === "HTTPError") {
      const errorJson = await error.response.json();
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error sending nomination to build: ${
          errorJson.error
        }.`
      );
      return {
        ok: false,
        error: errorJson.error,
        status: error.response.status,
      };
    }
    if (error instanceof Error) {
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error sending nomination to build: ${
          error.message
        }.`
      );
      return {
        ok: false,
        error: error.message,
        status: 500,
      };
    }
    throw error;
  }
};

const replyWithError = async (replyTo: string, text?: string) => {
  addToRepliesQueue({
    text: text || "There was an issue with your nomination. Please try again.",
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
  });
};

const replyWithSuccess = async (
  replyTo: string,
  nominator: string,
  nominee: string,
  pointsSent: number,
  text?: string
) => {
  addToRepliesQueue({
    text:
      text ||
      `Thanks @${nominator}, you just nominated @${nominee} with ${pointsSent} BUILD Points on https://build.top`,
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
  });
};

export const nominationsHandler = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    logger.log(`new nomination on fc received.`);

    const { data } = body;

    if (!data) {
      logger.error(`no data received.`);
      return res.status(200).send({ status: "nok" });
    }

    const {
      parent_hash: parentHash,
      author,
      text,
      mentioned_profiles: mentionedProfiles,
      hash,
    } = data;

    if (text.match(regexPattern) === null) {
      logger.error(`no nomination pattern found.`);
      return res.status(200).send({ status: "nok" });
    }

    const originWallet =
      author.verified_addresses &&
      author.verified_addresses.eth_addresses &&
      author.verified_addresses.eth_addresses.length > 0
        ? author.verified_addresses?.eth_addresses[0]
        : author.custody_address;

    if (parentHash) {
      // check the parent cast and get its caster as the nominated user
      const parentCast = await getCastFromHash(parentHash);

      if (!parentCast) {
        logger.error(`parent cast [${parentHash}] not found.`);
        replyWithError(hash);
        return res.status(200).send({ status: "nok" });
      }

      const walletToNominate =
        parentCast.cast.author.verified_addresses.eth_addresses[0];

      if (walletToNominate && originWallet) {
        const nominationResult = await createNomination(
          originWallet,
          walletToNominate,
          hash
        );
        if (nominationResult.ok === false) {
          if (nominationResult.status === 400) {
            replyWithError(hash, nominationResult.error);
          } else {
            replyWithError(hash);
          }
          return res.status(200).send({ status: "nok" });
        }
        replyWithSuccess(
          hash,
          author.username,
          parentCast.cast.author.username,
          nominationResult.nomination.buildPointsSent
        );
        return res.status(200).send({ status: "ok" });
      }

      replyWithError(hash);
      return res.status(200).send({ status: "nok" });
    }

    const buildbotFid = env.BUILDBOT_FARCASTER_FID;

    const notBotProfiles = mentionedProfiles.filter(
      (profile: { fid: number }) => profile.fid !== buildbotFid
    );

    if (!notBotProfiles || notBotProfiles?.length === 0) {
      logger.error(`no valid profiles mentioned.`);
      replyWithError(hash);
      return res.status(200).send({ status: "nok" });
    }

    const mentionedProfile = notBotProfiles[0];
    const walletToNominate =
      mentionedProfile.verified_addresses.eth_addresses[0];

    if (originWallet && walletToNominate) {
      const nominationResult = await createNomination(
        originWallet,
        walletToNominate,
        hash
      );
      if (nominationResult.ok === false) {
        if (nominationResult.status === 400) {
          replyWithError(hash, nominationResult.error);
        } else {
          replyWithError(hash);
        }
        return res.status(200).send({ status: "nok" });
      }
      replyWithSuccess(
        hash,
        author.username,
        mentionedProfile.username,
        nominationResult.nomination.buildPointsSent
      );
      return res.status(200).send({ status: "ok" });
    }

    replyWithError(hash);
    return res.status(200).send({ status: "nok" });
  } catch (error) {
    if (error instanceof HTTPError && error.name === "HTTPError") {
      const errorJson = await error.response.json();
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error sending nomination to build: ${
          errorJson.error
        }.`
      );
    }
    if (error instanceof Error) {
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error processing nomination: ${
          error.message
        }.`
      );
    }
    return res.status(200).send({ status: "nok" });
  }
};
