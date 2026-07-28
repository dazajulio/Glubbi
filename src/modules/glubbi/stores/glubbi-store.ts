import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlubbiCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface GlubbiState {
  customer: GlubbiCustomer | null;
  location: { lat: number; lng: number } | null;
  setCustomer: (customer: GlubbiCustomer) => void;
  setLocation: (location: { lat: number; lng: number } | null) => void;
  clearCustomer: () => void;
}

export const useGlubbiStore = create<GlubbiState>()(
  persist(
    (set) => ({
      customer: null,
      location: null,
      setCustomer: (customer) => set({ customer }),
      setLocation: (location) => set({ location }),
      clearCustomer: () => set({ customer: null }),
    }),
    {
      name: 'glubbi-session',
    }
  )
);
