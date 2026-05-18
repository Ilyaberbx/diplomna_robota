import '@testing-library/jest-dom/vitest';

// jsdom only exposes localStorage for a non-opaque origin. The vitest jsdom
// environment uses an opaque origin by default, so provide a deterministic
// in-memory Storage for tests that exercise persisted state.
const hasWorkingLocalStorage = (() => {
  try {
    return typeof window.localStorage?.setItem === 'function';
  } catch {
    return false;
  }
})();

if (!hasWorkingLocalStorage) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: memoryStorage,
  });
}
