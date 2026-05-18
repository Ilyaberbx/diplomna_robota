import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { createReport } from '../../api/create-report.js';
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
  setField: (key: keyof Fields, value: string) => void;
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

  const setField = useCallback((key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
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
      void createReport(client, result.value).match(
        (report) => {
          navigate(`/reports/${report.id}`, { replace: true });
        },
        () => {
          setSubmitting(false);
          setErrors({ form: 'Could not publish the report. Try again.' });
        },
      );
    },
    [client, fields, navigate],
  );

  return useMemo(
    () => ({ fields, errors, submitting, setField, onSubmit }),
    [fields, errors, submitting, setField, onSubmit],
  );
}
