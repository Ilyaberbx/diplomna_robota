import { z } from 'zod';

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
});

export const authResultSchema = z.object({
  token: z.string(),
  user: publicUserSchema,
});
