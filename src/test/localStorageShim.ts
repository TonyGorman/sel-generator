type StorageShim = {
  state: Map<string, string>;
  install: () => void;
  reset: () => void;
};

export const createLocalStorageShim = (): StorageShim => {
  const state = new Map<string, string>();

  const install = (): void => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => state.get(key) ?? null,
        setItem: (key: string, value: string) => {
          state.set(key, value);
        },
        removeItem: (key: string) => {
          state.delete(key);
        },
        clear: () => {
          state.clear();
        },
      },
    });
  };

  const reset = (): void => {
    install();
    state.clear();
  };

  return { state, install, reset };
};
