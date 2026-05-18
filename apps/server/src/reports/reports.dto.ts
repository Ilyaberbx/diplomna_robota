import { z } from 'zod';

export const reportKindSchema = z.enum(['lost', 'found']);
export const reportSpeciesSchema = z.enum(['dog', 'cat', 'bird', 'other']);
export const reportStatusSchema = z.enum([
  'active',
  'reunited',
  'resolved',
  'closed',
]);

const optionalText = z.string().trim().min(1).max(2000).optional();
const contactPhone = z.string().trim().min(3).max(40);
const contactEmail = z.string().trim().email().max(254);

export const createReportSchema = z
  .object({
    kind: reportKindSchema,
    species: reportSpeciesSchema,
    breed: optionalText,
    name: z.string().trim().min(1).max(120).optional(),
    color: optionalText,
    description: optionalText,
    contactPhone: contactPhone.optional(),
    contactEmail: contactEmail.optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    eventDate: z.coerce.date(),
  })
  .refine((v) => v.contactPhone !== undefined || v.contactEmail !== undefined, {
    message: 'At least one of contactPhone or contactEmail is required',
    path: ['contactPhone'],
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z
  .object({
    species: reportSpeciesSchema.optional(),
    breed: optionalText.nullable(),
    name: z.string().trim().min(1).max(120).nullable().optional(),
    color: optionalText.nullable(),
    description: optionalText.nullable(),
    contactPhone: contactPhone.nullable().optional(),
    contactEmail: contactEmail.nullable().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    eventDate: z.coerce.date().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field is required',
    path: ['species'],
  });

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

const positiveInt = z.coerce.number().int().positive();

export const browseQuerySchema = z
  .object({
    kind: reportKindSchema.optional(),
    species: reportSpeciesSchema.optional(),
    status: reportStatusSchema.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(20_000).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: positiveInt.default(1),
    pageSize: positiveInt.max(100).default(20),
  })
  .refine(
    (v) => {
      const hasArea =
        v.lat !== undefined || v.lng !== undefined || v.radiusKm !== undefined;
      const areaComplete =
        v.lat !== undefined &&
        v.lng !== undefined &&
        v.radiusKm !== undefined;
      return !hasArea || areaComplete;
    },
    {
      message: 'lat, lng and radiusKm must be provided together',
      path: ['radiusKm'],
    },
  );

export type BrowseQueryInput = z.infer<typeof browseQuerySchema>;

// Status route accepts only the reporter-initiated terminal targets; the
// service validates the transition is legal for the report's kind/state.
export const statusTransitionSchema = z.object({
  status: z.enum(['reunited', 'resolved', 'closed']),
});

export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
