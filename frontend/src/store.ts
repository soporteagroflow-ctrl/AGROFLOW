import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  loadFromStorage: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      AsyncStorage.removeItem('user');
    }
  },
  setToken: (token) => {
    set({ token });
    if (token) {
      AsyncStorage.setItem('session_token', token);
    } else {
      AsyncStorage.removeItem('session_token');
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  loadFromStorage: async () => {
    try {
      const [tokenStr, userStr] = await Promise.all([
        AsyncStorage.getItem('session_token'),
        AsyncStorage.getItem('user'),
      ]);
      if (tokenStr && userStr) {
        set({ token: tokenStr, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    await AsyncStorage.multiRemove(['session_token', 'user']);
    set({ user: null, token: null });
  },
}));
