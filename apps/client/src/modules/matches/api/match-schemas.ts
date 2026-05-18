import { z } from 'zod';

const matchStatus = z.enum(['proposed', 'confirmed', 'rejected']);

export const matchViewSchema = z.object({
  id: z.string(),
  lostReportId: z.string(),
  foundReportId: z.string(),
  proposedBy: z.string(),
  status: matchStatus,
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
});

export const matchListSchema = z.array(matchViewSchema);

const ownerReportSchema = z.object({
  id: z.string(),
  kind: z.enum(['lost', 'found']),
  reporterId: z.string(),
  status: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  name: z.string().nullable(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  photoKey: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  eventDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  viewer: z.literal('owner'),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
});

export const revealedMatchViewSchema = matchViewSchema.extend({
  lostReport: ownerReportSchema,
  foundReport: ownerReportSchema,
});
