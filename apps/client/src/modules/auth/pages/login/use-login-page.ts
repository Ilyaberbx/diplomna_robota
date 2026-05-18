import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthSession } from '../../providers/auth-session/index.js';

export function useLoginPage(): {
  email: string;
  password: string;
  error: string | null;
  submitting: boolean;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
} {
  const { login } = useAuthSession();
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
      void login({ email, password }).match(
        () => {
          navigate(next, { replace: true });
        },
        () => {
          setSubmitting(false);
          setError('Invalid email or password.');
        },
      );
    },
    [login, navigate, searchParams, email, password],
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
