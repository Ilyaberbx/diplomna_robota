export type StatusKind =
  | 'lost'
  | 'found'
  | 'active'
  | 'proposed'
  | 'confirmed'
  | 'rejected'
  | 'reunited'
  | 'resolved'
  | 'closed';

export type StatusTone =
  | 'urgent'
  | 'accent'
  | 'secondary'
  | 'pending'
  | 'success'
  | 'muted';

export type StatusDescriptor = {
  tone: StatusTone;
  /** 24×24 stroke path(s) — see DESIGN.md status → icon map. */
  icon: string;
};

export type StatusPillProps = {
  status: StatusKind;
  className?: string;
};
