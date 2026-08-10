import { z } from "zod";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 20;

export const chatTurnSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message can't be empty").max(MAX_MESSAGE_LENGTH),
  history: z.array(chatTurnSchema).max(MAX_HISTORY_TURNS).optional(),
});

export type ChatTurnInput = z.infer<typeof chatTurnSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
