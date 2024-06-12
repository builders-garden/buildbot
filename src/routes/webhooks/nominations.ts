import { Request, Response } from "express";
import ky from "ky";
import { getCastFromHash } from "../../utils/farcaster.js";
import { addToRepliesQueue } from "../../queues/index.js";

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
      status: string;
    };

const createNomination = async (
  originWallet: string,
  walletToNominate: string
): Promise<NominationResult> => {
  // send the request to the build API
  try {
    const result = await ky.post("https://build.top/api/nominations", {
      json: {
        walletToNominate,
        originWallet,
      },
    });
    const nomination: Nomination = await result.json();
    return {
      ok: true,
      nomination,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error sending nomination to build: ${
          error.message
        }.`
      );
      return {
        ok: false,
        error: error.message,
        status: error.name,
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

    console.log(
      `[/webhooks/nominations] [${new Date().toISOString()}] - new nomination on fc received.`
    );

    const { data } = body;

    if (!data) {
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - no data received.`
      );
      return res.status(200).send({ status: "nok" });
    }

    const {
      parent_hash: parentHash,
      author,
      text,
      mentioned_profiles: mentionedProfiles,
      hash,
    } = data;

    if (!text.includes("nominate") && !text.includes("nom")) {
      replyWithError(hash);
      return res.status(200).send({ status: "nok" });
    }

    const originWallet =
      author.verified_addresses?.length > 0
        ? author.verified_addresses?.eth_addresses[0]
        : author.custody_address;

    if (parentHash) {
      // check the parent cast and get its caster as the nominated user
      const parentCast = await getCastFromHash(parentHash);

      if (!parentCast) {
        console.error(
          `[/webhooks/nominations] [${new Date().toISOString()}] - parent cast [${parentHash}] not found.`
        );
        replyWithError(hash);
        return res.status(200).send({ status: "nok" });
      }

      const walletToNominate =
        parentCast.cast.author.verified_addresses.eth_addresses[0];

      if (walletToNominate && originWallet) {
        const nominationResult = await createNomination(
          originWallet,
          walletToNominate
        );
        if (nominationResult.ok === false) {
          replyWithError(hash);
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

    const notBotProfiles = mentionedProfiles.filter(
      (profile: { fid: number }) => profile.fid !== 531162
    );

    if (!notBotProfiles || notBotProfiles?.length === 0) {
      console.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - no valid profiles mentioned.`
      );
      replyWithError(hash);
      return res.status(200).send({ status: "nok" });
    }

    const mentionedProfile = notBotProfiles[0];
    const walletToNominate =
      mentionedProfile.verified_addresses.eth_addresses[0];

    if (originWallet && walletToNominate) {
      const nominationResult = await createNomination(
        originWallet,
        walletToNominate
      );
      if (nominationResult.ok === false) {
        replyWithError(hash);
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
  } catch (error: any) {
    console.error(
      `[/webhooks/nominations] [${new Date().toISOString()}] - error processing nomination: ${
        error.message
      }.`
    );
    return res.status(200).send({ status: "nok" });
  }
};
