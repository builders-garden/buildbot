import z from "zod";

export const mentionsSchema = z.object({
  nominator: z.string().min(1),
  nominee: z.string().min(1),
  points: z.number().positive().min(0),
});

export type MentionsBody = z.infer<typeof mentionsSchema>;

export const messageSchema = z.object({
  text: z.string().min(1),
});

export type MessageBody = z.infer<typeof messageSchema>;

export const messageWithRecipientSchema = z.object({
  text: z.string().min(1),
  recipient: z.string().min(1),
});

export type MessageWithRecipientBody = z.infer<
  typeof messageWithRecipientSchema
>;

export const remindersSchema = z.array(
  z.object({
    nominationsBudget: z.number().default(0),
    nominationsSent: z.number().default(0),
    wastedPoints: z.number().default(0),
    wallets: z.array(z.string().startsWith("0x")).default([]),
    farcasterUsername: z.string(),
  })
);

export type RemindersBody = z.infer<typeof remindersSchema>;

export const weeklyStatsSchema = z.array(
  z.object({
    nominationsReceived: z.number().default(0),
    nominationsSent: z.number().default(0),
    earnedPoints: z.number().default(0),
    wallets: z.array(z.string().startsWith("0x")).default([]),
    farcasterUsername: z.string(),
  })
);

export type WeeklyStatsBody = z.infer<typeof weeklyStatsSchema>;
