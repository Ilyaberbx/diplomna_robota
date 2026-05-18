import { useAccountPage } from './use-account-page.js';

export function AccountPage() {
  const { user, onLogout } = useAccountPage();
  return (
    <main>
      <h1>Account</h1>
      <p>Signed in as {user ? user.email : 'unknown'}.</p>
      <button type="button" onClick={onLogout}>
        Log out
      </button>
    </main>
  );
}
