import { z } from 'zod';

export const proposeMatchSchema = z.object({
  lostReportId: z.string().uuid(),
  foundReportId: z.string().uuid(),
});
export type ProposeMatchInput = z.infer<typeof proposeMatchSchema>;

export const listMatchesQuerySchema = z.object({
  reportId: z.string().uuid(),
});
export type ListMatchesQueryInput = z.infer<typeof listMatchesQuerySchema>;
