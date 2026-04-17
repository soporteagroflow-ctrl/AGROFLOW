import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

// ─── Auth Store ──────────────────────────────────────────────────────
interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  farm_name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  loadFromStorage: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      AsyncStorage.removeItem('user');
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  loadFromStorage: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        set({ user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Firebase sign out may fail if no user, that's ok
    }
    await AsyncStorage.removeItem('user');
    set({ user: null });
  },
}));

// ─── Toast Store ─────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

let _toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = `toast_${++_toastId}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
