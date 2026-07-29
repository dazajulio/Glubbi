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
  locationName: string | null;
  favoriteRestaurants: string[];
  setCustomer: (customer: GlubbiCustomer) => void;
  setLocation: (location: { lat: number; lng: number } | null, locationName?: string) => void;
  clearCustomer: () => void;
  toggleFavorite: (restaurantId: string) => void;
}

export const useGlubbiStore = create<GlubbiState>()(
  persist(
    (set) => ({
      customer: null,
      location: null,
      locationName: null,
      favoriteRestaurants: [],
      setCustomer: (customer) => set({ customer }),
      setLocation: (location, locationName) => set({ location, locationName: locationName || null }),
      clearCustomer: () => set({ customer: null }),
      toggleFavorite: (restaurantId) => set((state) => {
        const isFavorite = state.favoriteRestaurants.includes(restaurantId);
        if (isFavorite) {
          return { favoriteRestaurants: state.favoriteRestaurants.filter(id => id !== restaurantId) };
        } else {
          return { favoriteRestaurants: [...state.favoriteRestaurants, restaurantId] };
        }
      }),
    }),
    {
      name: 'glubbi-session',
    }
  )
);
