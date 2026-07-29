function getStorageAPI() {
  if (typeof window !== 'undefined' && window.storage) {
    return window.storage;
  }
  return {
    async get(key, shared) {
      const k = (shared ? 's:' : 'p:') + key;
      const val = localStorage.getItem(k);
      if (val === null) return null;
      return { key, value: val, shared: !!shared };
    },
    async set(key, value, shared) {
      const k = (shared ? 's:' : 'p:') + key;
      localStorage.setItem(k, value);
      return { key, value, shared: !!shared };
    },
    async delete(key, shared) {
      const k = (shared ? 's:' : 'p:') + key;
      const existed = localStorage.getItem(k) !== null;
      localStorage.removeItem(k);
      return { key, deleted: existed, shared: !!shared };
    },
    async list(prefix, shared) {
      const pfx = (shared ? 's:' : 'p:') + (prefix || '');
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(pfx)) keys.push(k.slice(2));
      }
      return { keys, prefix, shared: !!shared };
    },
  };
}

export const storage = getStorageAPI();
