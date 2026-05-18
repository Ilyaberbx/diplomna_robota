import { z } from 'zod';
import type { CreateReportInput, ReportKind } from '../../reports.types.js';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

export const createReportFormSchema = z
  .object({
    kind: z.enum(['lost', 'found']),
    species: z.enum(['dog', 'cat', 'bird', 'other']),
    name: z.string().trim().max(120).optional().or(z.literal('')),
    breed: z.string().trim().max(2000).optional().or(z.literal('')),
    color: z.string().trim().max(2000).optional().or(z.literal('')),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
    contactEmail: z
      .string()
      .trim()
      .email('Enter a valid email')
      .optional()
      .or(z.literal('')),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    eventDate: requiredText('Date'),
  })
  .refine(
    (v) =>
      (v.contactPhone ?? '') !== '' || (v.contactEmail ?? '') !== '',
    {
      message: 'Provide a phone or an email so you can be reached',
      path: ['contactPhone'],
    },
  );

export type CreateReportFormErrors = Partial<
  Record<keyof z.infer<typeof createReportFormSchema> | 'form', string>
>;

export type ValidatedForm =
  | { ok: true; value: CreateReportInput }
  | { ok: false; errors: CreateReportFormErrors };

export function validateCreateReportForm(raw: {
  kind: ReportKind;
  species: string;
  name: string;
  breed: string;
  color: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  lat: string;
  lng: string;
  eventDate: string;
}): ValidatedForm {
  const parsed = createReportFormSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: CreateReportFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] as string) ?? 'form';
      if (!(key in errors))
        (errors as Record<string, string>)[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const d = parsed.data;
  const blankToUndef = (s: string | undefined): string | undefined =>
    s && s !== '' ? s : undefined;
  return {
    ok: true,
    value: {
      kind: d.kind,
      species: d.species,
      name: blankToUndef(d.name),
      breed: blankToUndef(d.breed),
      color: blankToUndef(d.color),
      description: blankToUndef(d.description),
      contactPhone: blankToUndef(d.contactPhone),
      contactEmail: blankToUndef(d.contactEmail),
      lat: d.lat,
      lng: d.lng,
      eventDate: new Date(d.eventDate).toISOString(),
    },
  };
}
