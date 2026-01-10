import { create } from "zustand";

interface ScopeUrlStore {
  url: string;
  setUrl: (url: string) => void;
}

export const useScopeUrl = create<ScopeUrlStore>((set) => ({
  url: import.meta.env.VITE_SCOPE_URL || "",
  setUrl: (url) => set({ url }),
}));

// Helper para obtener la URL actual (para usar fuera de React)
export const getScopeUrl = () => useScopeUrl.getState().url;
