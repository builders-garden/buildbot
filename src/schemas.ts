import z from "zod";

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

export const messageWithRecipientSchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  recipient: z.string().min(1),
});

export type MessageWithRecipientBody = z.infer<
  typeof messageWithRecipientSchema
>;

export const messageWithFarcasterIdSchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  farcasterId: z.number(),
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
  sender: z.string().min(1),
  receiver: z.union([z.string().min(1), z.number()]),
  channels: z.array(z.string()).default([]),
});

export type MessageBody = z.infer<typeof messageSchema>;
