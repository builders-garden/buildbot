import z from "zod";

export enum TalentProtocolSender {
  BUILDBOT = "buildbot",
  TALENTBOT = "talentbot",
}

export enum ChannelService {
  FarcasterDC = "farcaster-dc",
  XMTP = "xmtp",
}

export const mentionsSchema = z.object({
  nominatorWallet: z.string(),
  nominatedWallet: z.string(),
  points: z.number().positive().min(0),
});

export type MentionsBody = z.infer<typeof mentionsSchema>;

export const simpleCastSchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
});

export type SimpleCastBody = z.infer<typeof simpleCastSchema>;

export const replySchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  replyTo: z.string().min(1),
});

export type ReplyBody = z.infer<typeof replySchema>;

export const messageWithRecipientSchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  recipient: z.string().min(1),
  sender: z.optional(z.nativeEnum(TalentProtocolSender)),
});

export type MessageWithRecipientBody = z.infer<
  typeof messageWithRecipientSchema
>;

export const messageWithFarcasterIdSchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  farcasterId: z.number(),
  sender: z.optional(z.string()),
});

export type MessageWithFarcasterIdBody = z.infer<
  typeof messageWithFarcasterIdSchema
>;

export const remindersSchema = z.array(
  z.object({
    nominationsBudget: z.number().default(0),
    nominationsSent: z.number().default(0),
    wastedPoints: z.number().default(0),
    wallets: z.array(z.string().startsWith("0x")).default([]),
    farcasterId: z.number(),
  })
);

export type RemindersBody = z.infer<typeof remindersSchema>;

export const weeklyStatsSchema = z.array(
  z.object({
    nominationsReceived: z.number().default(0),
    nominationsSent: z.number().default(0),
    earnedPoints: z.number().default(0),
    wallets: z.array(z.string().startsWith("0x")).default([]),
    farcasterId: z.number(),
  })
);

export type WeeklyStatsBody = z.infer<typeof weeklyStatsSchema>;

export const messageSchema = z.object({
  text: z.string().min(1),
  sender: z.nativeEnum(TalentProtocolSender),
  receiver: z.union([z.string().min(1), z.number()]),
  channels: z.array(z.nativeEnum(ChannelService)),
});

export type MessageBody = z.infer<typeof messageSchema>;

export const subscriberSchema = z.object({
  channel: z.nativeEnum(ChannelService),
  fid: z.optional(z.number().int()),
  address: z.optional(z.string()),
  sender: z.nativeEnum(TalentProtocolSender),
});

export type SubscriberParams = z.infer<typeof subscriberSchema>;
