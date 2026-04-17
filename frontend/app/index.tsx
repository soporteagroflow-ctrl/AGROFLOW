import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithRedirect } from 'firebase/auth';

import { auth, googleProvider } from '../src/firebase';
import { useTheme } from '../src/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../src/theme';
import { Button, Card, Pill, ScreenBackground } from '../src/ui';

export default function LoginScreen() {
  const { palette, mode, toggleMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (Platform.OS === 'web') {
        const { signInWithPopup } = require('firebase/auth');
        await signInWithPopup(auth, googleProvider);
      } else {
        await signInWithRedirect(auth, googleProvider);
      }
      // Firebase will handle the rest
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Top bar with logo and theme toggle */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: palette.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}
            >
              <Ionicons name="leaf" size={16} color="#FFFFFF" />
            </View>
            <Text
              style={{
                color: palette.text,
                fontSize: FONT_SIZE.lg,
                fontWeight: '700',
                letterSpacing: -0.2,
              }}
            >
              AgroFlow
            </Text>
          </View>
          <Pressable
            onPress={toggleMode}
            style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: palette.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name={mode === 'dark' ? 'sunny' : 'moon'}
              size={18}
              color={palette.text}
            />
          </Pressable>
        </View>

        {/* Hero block */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.xxl,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: palette.accent,
              fontSize: FONT_SIZE.xs,
              letterSpacing: 1.4,
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: SPACING.md,
            }}
          >
            Gestión ganadera conectada
          </Text>
          <Text
            style={{
              color: palette.text,
              fontSize: FONT_SIZE.title,
              fontWeight: '800',
              textAlign: 'center',
              letterSpacing: -1,
              lineHeight: FONT_SIZE.title * 1.05,
              maxWidth: 720,
            }}
          >
            Toda tu finca, en un panel.
          </Text>
          <Text
            style={{
              color: palette.textSecondary,
              fontSize: FONT_SIZE.lg,
              textAlign: 'center',
              marginTop: SPACING.md,
              maxWidth: 560,
              lineHeight: FONT_SIZE.lg * 1.5,
            }}
          >
            Controla ganado, potreros, alertas y finanzas con una experiencia limpia, rápida y
            pensada para el campo.
          </Text>

          {/* Category pills, HF-style */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: SPACING.lg,
            }}
          >
            {[
              { label: 'Ganado', accent: 'accent' as const },
              { label: 'Potreros', accent: 'teal' as const },
              { label: 'Alertas', accent: 'orange' as const },
              { label: 'Finanzas', accent: 'purple' as const },
              { label: 'NDVI', accent: 'green' as const },
            ].map((p) => (
              <View key={p.label} style={{ marginRight: 8, marginBottom: 8 }}>
                <Pill label={p.label} accent={p.accent} />
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={{ flexDirection: 'row', marginTop: SPACING.xl, gap: SPACING.md }}>
            <Button
              label={loading ? 'Conectando…' : 'Continuar con Google'}
              onPress={handleGoogleLogin}
              variant="primary"
              loading={loading}
              icon={
                <Ionicons
                  name="logo-google"
                  size={18}
                  color={palette.btnPrimaryFg}
                />
              }
              size="lg"
            />
            <Button
              label="Saber más"
              variant="secondary"
              onPress={() => {}}
              size="lg"
            />
          </View>

          {error ? (
            <Text
              style={{
                color: palette.red,
                fontSize: FONT_SIZE.sm,
                marginTop: SPACING.md,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          ) : null}

          <Text
            style={{
              color: palette.textTertiary,
              fontSize: FONT_SIZE.xs,
              marginTop: SPACING.md,
            }}
          >
            Al continuar, aceptas los términos y condiciones de uso.
          </Text>
        </View>

        {/* Feature cards strip */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            paddingHorizontal: SPACING.lg,
            marginTop: SPACING.xxl,
            gap: SPACING.md as unknown as number,
          }}
        >
          {[
            {
              icon: 'paw' as const,
              accent: 'accent' as const,
              title: 'Ganado',
              body: 'Registro, peso, vacunas y parto esperado con alertas automáticas.',
            },
            {
              icon: 'map' as const,
              accent: 'teal' as const,
              title: 'Potreros',
              body: 'Capacidad, estado del pasto y rotación asistida con recomendaciones.',
            },
            {
              icon: 'notifications' as const,
              accent: 'orange' as const,
              title: 'Alertas',
              body: 'Vacunación pendiente, parto próximo, saturación — ordenadas por severidad.',
            },
            {
              icon: 'cash' as const,
              accent: 'purple' as const,
              title: 'Finanzas',
              body: 'Ingresos y gastos por categoría con resumen y margen por período.',
            },
          ].map((f) => (
            <Card
              key={f.title}
              style={{
                minWidth: 260,
                maxWidth: 320,
                flex: 1,
                marginBottom: SPACING.md,
                marginHorizontal: SPACING.sm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: palette[`${f.accent}Soft` as keyof typeof palette] as string,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                <Ionicons name={f.icon} size={18} color={palette[f.accent]} />
              </View>
              <Text
                style={{
                  color: palette.text,
                  fontSize: FONT_SIZE.lg,
                  fontWeight: '700',
                  marginBottom: 6,
                }}
              >
                {f.title}
              </Text>
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  lineHeight: FONT_SIZE.sm * 1.5,
                }}
              >
                {f.body}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Text
          style={{
            color: palette.textTertiary,
            fontSize: FONT_SIZE.xs,
            textAlign: 'center',
            paddingVertical: SPACING.xl,
          }}
        >
          © AgroFlow · Hecho para fincas de verdad.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}
