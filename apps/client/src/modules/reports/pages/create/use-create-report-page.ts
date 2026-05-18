import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { createReport } from '../../api/create-report.js';
import { uploadPhoto } from '../../api/upload-photo.js';
import {
  validateCreateReportForm,
  type CreateReportFormErrors,
} from './create-report-form.utils.js';
import type { ReportKind } from '../../reports.types.js';

type Fields = {
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
};

const EMPTY: Omit<Fields, 'kind'> = {
  species: 'dog',
  name: '',
  breed: '',
  color: '',
  description: '',
  contactPhone: '',
  contactEmail: '',
  lat: '',
  lng: '',
  eventDate: '',
};

export function useCreateReportPage(): {
  fields: Fields;
  errors: CreateReportFormErrors;
  submitting: boolean;
  photoName: string | null;
  setField: (key: keyof Fields, value: string) => void;
  setPhoto: (file: File | null) => void;
  skipPhoto: () => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
} {
  const client = useApiClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKind: ReportKind =
    searchParams.get('kind') === 'found' ? 'found' : 'lost';

  const [fields, setFields] = useState<Fields>({
    kind: initialKind,
    ...EMPTY,
  });
  const [errors, setErrors] = useState<CreateReportFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhotoState] = useState<File | null>(null);

  const setField = useCallback((key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setPhoto = useCallback((file: File | null) => {
    setPhotoState(file);
  }, []);

  const skipPhoto = useCallback(() => {
    setPhotoState(null);
  }, []);

  const onSubmit = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const result = validateCreateReportForm(fields);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      setSubmitting(true);
      // Photo is optional and never blocking: an upload failure still lands
      // the user on the published report (DESIGN_BRIEF — photo can be added
      // later).
      void createReport(client, result.value).match(
        (report) => {
          const hasPhoto = photo !== null;
          if (!hasPhoto) {
            navigate(`/reports/${report.id}`, { replace: true });
            return;
          }
          void uploadPhoto(client, report.id, photo).match(
            () => navigate(`/reports/${report.id}`, { replace: true }),
            () => navigate(`/reports/${report.id}`, { replace: true }),
          );
        },
        () => {
          setSubmitting(false);
          setErrors({ form: 'create.err.publishFailed' });
        },
      );
    },
    [client, fields, navigate, photo],
  );

  const photoName = photo ? photo.name : null;

  return useMemo(
    () => ({
      fields,
      errors,
      submitting,
      photoName,
      setField,
      setPhoto,
      skipPhoto,
      onSubmit,
    }),
    [
      fields,
      errors,
      submitting,
      photoName,
      setField,
      setPhoto,
      skipPhoto,
      onSubmit,
    ],
  );
}
