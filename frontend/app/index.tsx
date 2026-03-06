import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../src/theme';

export default function LoginScreen() {
  const handleGoogleLogin = () => {
    if (Platform.OS === 'web') {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = window.location.origin + '/#session_id=';
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/')}`;
      window.location.href = authUrl;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.heroOverlay}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={40} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.appName}>RanchoPro</Text>
          <Text style={styles.tagline}>Gestión Ganadera Inteligente</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSubtitle}>
          Administra tu finca ganadera con tecnología de punta. Control total de ganado, potreros y finanzas.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Registro y seguimiento de ganado</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Mapas de potreros en tiempo real</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Predicciones con Inteligencia Artificial</Text>
          </View>
        </View>

        <TouchableOpacity
          testID="login-google-button"
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={22} color={COLORS.white} />
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Al continuar, aceptas los términos y condiciones de uso
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    flex: 0.4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(46, 125, 50, 0.85)',
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255,255,255,0.9)',
    marginTop: SPACING.xs,
  },
  bottomSection: {
    flex: 0.6,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  features: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  disclaimer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
