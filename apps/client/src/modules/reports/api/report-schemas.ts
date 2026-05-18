import { z } from 'zod';

const reportKind = z.enum(['lost', 'found']);
const reportSpecies = z.enum(['dog', 'cat', 'bird', 'other']);
const reportStatus = z.enum(['active', 'reunited', 'resolved', 'closed']);

export const publicReportSchema = z.object({
  id: z.string(),
  kind: reportKind,
  reporterId: z.string(),
  status: reportStatus,
  species: reportSpecies,
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
});

export const reportProjectionSchema = z.discriminatedUnion('viewer', [
  publicReportSchema.extend({ viewer: z.literal('public') }),
  publicReportSchema.extend({
    viewer: z.literal('owner'),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
  }),
]);

export const reportPageSchema = z.object({
  items: z.array(publicReportSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
