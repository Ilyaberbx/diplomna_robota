import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title: string;
  message?: string;
  /** Optional call to action (e.g. a link/button). */
  children?: ReactNode;
};
