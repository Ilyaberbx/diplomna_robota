import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusCodes } from 'http-status-codes';
import { useAuthSession } from '../../providers/auth-session/index.js';

export function useRegisterPage(): {
  email: string;
  password: string;
  error: string | null;
  submitting: boolean;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
} {
  const { register } = useAuthSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      const next = searchParams.get('next') ?? '/';
      void register({ email, password }).match(
        () => {
          navigate(next, { replace: true });
        },
        (err) => {
          setSubmitting(false);
          const isEmailTaken =
            err.kind === 'api' && err.status === StatusCodes.CONFLICT;
          setError(
            isEmailTaken
              ? 'That email is already registered.'
              : 'Could not create the account. Check the form and try again.',
          );
        },
      );
    },
    [register, navigate, searchParams, email, password],
  );

  return {
    email,
    password,
    error,
    submitting,
    setEmail,
    setPassword,
    onSubmit,
  };
}
