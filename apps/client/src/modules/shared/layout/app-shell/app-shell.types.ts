export type AppShellProps = {
  /** Current signed-in user's email, or null when anonymous/loading. */
  userEmail: string | null;
  /** True while the auth session is still resolving. */
  isLoading: boolean;
  onLogout: () => void;
};
