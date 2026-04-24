import { create } from 'zustand';
import { User } from '@/models/User';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isForceChangePassword: boolean;
  setUser: (user: User) => void;
  setForceChangePassword: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isForceChangePassword: false,

  setUser: (user) => set({ user, isAuthenticated: true, isForceChangePassword: false }),

  setForceChangePassword: (value) => set({ isForceChangePassword: value }),

  clearAuth: () =>
    set({ user: null, isAuthenticated: false, isForceChangePassword: false }),
}));
