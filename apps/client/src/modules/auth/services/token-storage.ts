const TOKEN_KEY = 'petfinder.auth.token';

export type TokenStorage = {
  get: () => string | null;
  set: (token: string) => void;
  clear: () => void;
};

export function createTokenStorage(): TokenStorage {
  return {
    get: () => {
      try {
        return window.localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    },
    set: (token: string) => {
      try {
        window.localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // Storage unavailable (private mode / quota): the session simply
        // does not persist across reloads. Not an error worth surfacing.
      }
    },
    clear: () => {
      try {
        window.localStorage.removeItem(TOKEN_KEY);
      } catch {
        // See set(): a failed clear is non-fatal.
      }
    },
  };
}

export const tokenStorage = createTokenStorage();
