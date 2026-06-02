import { z } from "zod";

const allowedChatModels = ["openai/gpt-3.5-turbo", "openai/gpt-4o-mini"];

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(4000),
});

const summarizeMessageSchema = z.object({
  username: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(4000),
});

export const authSchemas = {
  forgotPassword: {
    body: z.object({
      email: z.string().trim().email(),
    }),
  },
  resetPassword: {
    params: z.object({
      token: z.string().trim().min(1),
    }),
    body: z
      .object({
        password: z.string().min(6).optional(),
        newPassword: z.string().min(6).optional(),
      })
      .refine((data) => data.password || data.newPassword, {
        message: "Password is required",
        path: ["password"],
      }),
  },
  login: {
    body: z.object({
      email: z.string().trim().email().optional(),
      password: z.string().min(1).optional(),
    }),
  },
};

export const chatSchemas = {
  chatCompletion: {
    body: z
      .object({
        messages: z.array(chatMessageSchema).min(1).max(50),
        model: z.enum(allowedChatModels).default("openai/gpt-3.5-turbo"),
        max_tokens: z.number().int().positive().max(512).optional(),
        temperature: z.number().min(0).max(2).default(0.7),
      })
      .superRefine((data, ctx) => {
        const totalLength = data.messages.reduce((sum, message) => sum + message.content.length, 0);

        if (totalLength > 20000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["messages"],
            message: "Total message content exceeds maximum allowed length.",
          });
        }
      }),
  },
};

export const aiSchemas = {
  askAI: {
    body: z.object({
      messages: z.array(
        z.object({
          role: z.string().optional(),
          content: z.string().trim().min(1).max(4000),
        })
      ).min(1).max(50),
      systemPrompt: z.string().optional(),
      model: z.string().optional()
    }),
  },
  generateSessionSummary: {
    body: z
      .object({
        messages: z.array(summarizeMessageSchema).min(1).max(100),
      })
      .superRefine((data, ctx) => {
        const totalLength = data.messages.reduce(
          (sum, message) => sum + message.message.length + (message.username?.length || 0),
          0
        );

        if (totalLength > 20000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["messages"],
            message: "Total message content exceeds maximum allowed length.",
          });
        }
      }),
  },
};
