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

export const ALLOWED_INTERVIEW_ROLES = [
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Data Scientist",
    "Data Engineer",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Site Reliability Engineer",
    "Product Manager",
    "Engineering Manager",
    "QA Engineer",
    "Security Engineer",
    "Mobile Engineer",
    "Cloud Architect",
  ];

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
  mockInterviewChat: {
    body: z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(2000),
        })
      ).min(1).max(50),
      role: z.string().trim().min(1).max(100)
        .regex(/^[a-zA-Z0-9 ,\-_]+$/, "Role contains invalid characters")
        .refine((val) => ALLOWED_INTERVIEW_ROLES.includes(val), {
            message: `Role must be one of: ${ALLOWED_INTERVIEW_ROLES.join(", ")}`,
          }
        ),
    }),
  },
  mockInterviewReport: {
    body: z
      .object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(4000),
          })
        ).min(1).max(100),
      })
      .superRefine((data, ctx) => {
        const totalLength = data.messages.reduce(
          (sum, m) => sum + m.content.length,
          0
        );
        if (totalLength > 20000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["messages"],
            message: "Total content exceeds maximum allowed length",
          });
        }
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

export const matchSchemas = {
  getRecommendedPartners: {
    query: z.object({
      page: z
        .string()
        .optional()
        .refine(
          (val) =>
            val === undefined ||
            (/^\d+$/.test(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 1000),
          {
            message: "page must be an integer between 1 and 1000",
          }
        ),
      limit: z
        .string()
        .optional()
        .refine((val) => val === undefined || (/^\d+$/.test(val) && parseInt(val) >= 1 && parseInt(val) <= 20), {
          message: "limit must be an integer between 1 and 20",
        }),
    }),
  },
  getSupabaseDiscover: {
    query: z.object({
      search: z.string().optional(),
      filter: z.string().optional(),
      limit: z
        .string()
        .optional()
        .refine((val) => val === undefined || (/^\d+$/.test(val) && parseInt(val) >= 1 && parseInt(val) <= 100), {
          message: "limit must be an integer between 1 and 100",
        }),
      page: z
        .string()
        .optional()
        .refine(
          (val) =>
            val === undefined ||
            (/^\d+$/.test(val) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 1000),
          {
            message: "page must be an integer between 1 and 1000",
          }
        ),
    }),
  },
};

export const reviewSchemas = {
  submitReview: {
    body: z.object({
      sessionId: z.string().trim().uuid("Invalid session ID format"),
      rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
      tags: z
        .array(
          z.preprocess(
            (val) => {
              if (typeof val !== "string") return val;
              return val
                .trim()
                .replace(/<[^>]*>/g, "") // Strip HTML tags
                .replace(/[^a-zA-Z0-9\s-\/]/g, "") // Keep alphanumeric, spaces, hyphens, slashes
                .trim();
            },
            z.string()
              .min(1, "Tag cannot be empty")
              .max(50, "Tag must be at most 50 characters")
          )
        )
        .default([])
        .transform((tags) => {
          const canonicalTags = [
            "Clear Explanations",
            "Knowledgeable",
            "Patient",
            "Friendly",
            "Responsive",
            "Average Experience",
            "Unresponsive",
            "Poor Communication",
            "Technical Issues",
            "Misleading Skills",
          ];
          return tags.map((tag) => {
            const found = canonicalTags.find(
              (ct) => ct.toLowerCase() === tag.toLowerCase()
            );
            return found || tag;
          });
        }),
      comment: z.string().trim().max(300, "Comment must be at most 300 characters").optional().nullable(),
    }),
  },
};
