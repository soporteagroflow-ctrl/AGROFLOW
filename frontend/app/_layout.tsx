import { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

import { auth } from '../src/firebase';
import { useAuthStore } from '../src/store';
import { firebaseLogin, getMe } from '../src/api';
import { ThemeProvider, useTheme } from '../src/ThemeContext';
import { ToastContainer } from '../src/Toast';

function RootLayoutInner() {
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { palette, mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Handle redirect result when returning from Google login
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          await firebaseLogin(idToken);
          const res = await getMe();
          setUser(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
        setLoading(false);
      });
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await firebaseLogin(idToken);
          const res = await getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Auth error:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== '/') {
      router.replace('/');
    } else if (user && pathname === '/') {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, pathname]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator size="large" color={palette.accent} />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="animal/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="animal/nuevo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="potrero/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="potrero/nuevo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="alertas" options={{ presentation: 'modal' }} />
      </Stack>
      <ToastContainer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
