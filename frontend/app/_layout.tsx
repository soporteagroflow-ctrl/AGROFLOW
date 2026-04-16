import { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../src/store';
import { getMe, exchangeSession } from '../src/api';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  const { user, setUser, setToken, loadFromStorage, isLoading, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Handle OAuth callback from URL hash
  useEffect(() => {
    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        setIsProcessingAuth(true);
        const sessionId = hash.split('session_id=')[1]?.split('&')[0];
        if (sessionId) {
          // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
          exchangeSession(sessionId)
            .then((res) => {
              const { user: userData, session_token } = res.data;
              setUser(userData);
              setToken(session_token);
              window.location.hash = '';
              setIsProcessingAuth(false);
              router.replace('/(tabs)/dashboard');
            })
            .catch(() => {
              setIsProcessingAuth(false);
              window.location.hash = '';
            });
        }
        return;
      }
    }
  }, []);

  // Load stored auth
  useEffect(() => {
    if (!isProcessingAuth) {
      loadFromStorage();
    }
  }, [isProcessingAuth]);

  // Verify session on load
  useEffect(() => {
    if (!isLoading && !isProcessingAuth && useAuthStore.getState().token) {
      getMe()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
        });
    }
  }, [isLoading, isProcessingAuth]);

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading || isProcessingAuth) return;
    if (!user && pathname !== '/') {
      router.replace('/');
    } else if (user && pathname === '/') {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, isProcessingAuth, pathname]);

  if (isLoading || isProcessingAuth) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="animal/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="animal/nuevo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="potrero/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="potrero/nuevo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="alertas" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
