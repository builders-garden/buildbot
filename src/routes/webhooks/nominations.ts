import { Request, Response } from "express";
import ky from "ky";
import { getCastFromHash } from "../../utils/farcaster.js";

const createNomination = async (
  originWallet: string,
  walletToNominate: string
) => {
  // send the request to the build API
  try {
    await ky.post("https://build.top/api/nominations", {
      json: {
        walletToNominate,
        originWallet,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[/webhooks/nominations] [${Date.now()}] - error sending nomination to build: ${
          error.message
        }.`
      );
    }
  }
};

export const nominationsHandler = async (req: Request, res: Response) => {
  const { body } = req;

  console.log(
    `[/webhooks/nominations] [${Date.now()}] - new nomination on fc received.`
  );

  const { data } = body;

  if (!data) {
    console.error(
      `[/webhooks/nominations] [${Date.now()}] - no data received.`
    );

    return res.status(200).send({ status: "nok" });
  }

  const {
    parent_hash: parentHash,
    author,
    text,
    mentioned_profiles: mentionedProfiles,
  } = data;

  const originWallet =
    author.verified_addresses?.length > 0
      ? author.verified_addresses?.eth_addresses[0]
      : author.custody_address;

  if (parentHash) {
    // check the parent cast and get its caster as the nominated user
    const parentCast = await getCastFromHash(parentHash);

    if (!parentCast) {
      console.error(
        `[/webhooks/nominations] [${Date.now()}] - parent cast [${parentHash}] not found.`
      );

      return res.status(200).send({ status: "nok" });
    }

    if (!text.includes("nominate") && !text.includes("nom")) {
      return res.status(200).send({ status: "nok" });
    }

    const walletToNominate =
      parentCast.cast.author.verified_addresses.eth_addresses[0];

    if (walletToNominate && originWallet) {
      await createNomination(originWallet, walletToNominate);
      return res.status(200).send({ status: "ok" });
    }

    return res.status(200).send({ status: "nok" });
  }

  const notBotProfiles = mentionedProfiles.find(
    (profile: { fid: number }) => profile.fid !== 531162
  );

  if (notBotProfiles.lenght === 0) {
    console.error(
      `[/webhooks/nominations] [${Date.now()}] - no valid profiles mentioned.`
    );
    return res.status(200).send({ status: "nok" });
  }

  const mentionedProfile = notBotProfiles[0];
  const walletToNominate = mentionedProfile.verified_addresses.eth_addresses[0];

  if (originWallet && walletToNominate) {
    await createNomination(originWallet, walletToNominate);
    return res.status(200).send({ status: "ok" });
  }

  return res.status(200).send({ status: "nok" });
};
