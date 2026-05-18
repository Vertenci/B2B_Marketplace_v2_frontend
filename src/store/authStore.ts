import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  activeCompany: Company | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setActiveCompany: (company: Company | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeCompany: null,
      setUser: (user) => set({ user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setActiveCompany: (company) => set({ activeCompany: company }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, activeCompany: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeCompany: state.activeCompany,
      }),
    }
  )
);
