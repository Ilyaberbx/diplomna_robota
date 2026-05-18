import type { StatusDescriptor, StatusKind } from './status-pill.types.js';

/**
 * Status → tone + icon. Mirrors the DESIGN.md "Status → token map". The
 * human label is no longer stored here — it is resolved at render through
 * the i18n catalog key `status.<kind>` (see ADR 0007). Status is always
 * icon + label + color together, never color alone. Icon paths are 24×24,
 * drawn with the shared stroke settings in the SVG.
 */
export const STATUS_DESCRIPTORS = {
  lost: {
    tone: 'urgent',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8v5M12 16.5h.01',
  },
  found: {
    tone: 'accent',
    icon: 'M12 20s-6.5-4.2-6.5-9A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6.5 3c0 4.8-6.5 9-6.5 9z',
  },
  active: {
    tone: 'secondary',
    icon: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13',
  },
  proposed: {
    tone: 'pending',
    icon: 'M8 5 4 9l4 4M4 9h11M16 19l4-4-4-4M20 15H9',
  },
  confirmed: {
    tone: 'success',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8.5 12l2.5 2.5 4.5-5',
  },
  rejected: {
    tone: 'muted',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M9 9l6 6M15 9l-6 6',
  },
  reunited: {
    tone: 'success',
    icon: 'M5 13l1.5-7h11L19 13M5 13h14v6H5zM9 9h6',
  },
  resolved: {
    tone: 'success',
    icon: 'M5 13l1.5-7h11L19 13M5 13h14v6H5zM9 9h6',
  },
  closed: {
    tone: 'muted',
    icon: 'M4 7h16v4H4zM6 11v8h12v-8M10 14h4',
  },
} as const satisfies Record<StatusKind, StatusDescriptor>;
