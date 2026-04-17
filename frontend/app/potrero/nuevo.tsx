import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { createPaddock } from '../../src/api';
import { AccentKey, FONT_SIZE, RADIUS, SPACING } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { Button, Card, Input, ScreenBackground } from '../../src/ui';

const GRASS_OPTIONS: { key: string; label: string; accent: AccentKey }[] = [
  { key: 'bueno', label: 'Bueno', accent: 'green' },
  { key: 'regular', label: 'Regular', accent: 'orange' },
  { key: 'malo', label: 'Malo', accent: 'red' },
];

const STATUS_OPTIONS: { key: string; label: string; accent: AccentKey }[] = [
  { key: 'activo', label: 'Activo', accent: 'green' },
  { key: 'en_descanso', label: 'En descanso', accent: 'orange' },
  { key: 'mantenimiento', label: 'Mantenimiento', accent: 'accent' },
];

const GRASS_TYPES = ['Brachiaria', 'Estrella', 'Guinea', 'Kikuyo', 'Pangola', 'Otro'];

export default function NuevoPotrero() {
  const router = useRouter();
  const { palette } = useTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    area_hectares: '',
    grass_type: '',
    grass_status: 'bueno',
    capacity: '',
    center_lat: '',
    center_lng: '',
    status: 'activo',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await createPaddock({
        ...form,
        area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : 0,
        capacity: form.capacity ? parseInt(form.capacity, 10) : 0,
        center_lat: form.center_lat ? parseFloat(form.center_lat) : 4.609,
        center_lng: form.center_lng ? parseFloat(form.center_lng) : -74.082,
        coordinates: [],
      });
      router.back();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.sm,
          }}
        >
          <Pressable
            testID="nuevo-potrero-back"
            onPress={() => router.back()}
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
            <Ionicons name="arrow-back" size={18} color={palette.text} />
          </Pressable>
          <Text
            style={{
              color: palette.text,
              fontSize: FONT_SIZE.lg,
              fontWeight: '800',
              letterSpacing: -0.2,
            }}
          >
            Nuevo potrero
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }}
          >
            <Card padding={SPACING.md} style={{ marginTop: SPACING.md }}>
              <Input
                testID="nuevo-potrero-name"
                label="Nombre *"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Potrero Norte"
              />
              <Input
                testID="nuevo-potrero-area"
                label="Área (hectáreas)"
                value={form.area_hectares}
                onChangeText={(v) => setForm({ ...form, area_hectares: v })}
                keyboardType="numeric"
                placeholder="15"
              />

              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
                  marginTop: SPACING.md,
                  marginBottom: 6,
                }}
              >
                Tipo de pasto
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {GRASS_TYPES.map((g) => {
                  const active = form.grass_type === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setForm({ ...form, grass_type: g })}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: RADIUS.pill,
                        backgroundColor: active ? palette.text : 'transparent',
                        borderColor: active ? palette.text : palette.border,
                        borderWidth: 1,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? palette.background : palette.textSecondary,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '600',
                        }}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
                  marginTop: SPACING.md,
                  marginBottom: 6,
                }}
              >
                Estado del pasto
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {GRASS_OPTIONS.map((g, i) => {
                  const active = form.grass_status === g.key;
                  const soft = palette[`${g.accent}Soft` as keyof typeof palette] as string;
                  return (
                    <Pressable
                      key={g.key}
                      onPress={() => setForm({ ...form, grass_status: g.key })}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: active ? soft : palette.surface,
                        borderColor: active ? palette[g.accent] : palette.border,
                        borderWidth: 1,
                        marginRight: i < GRASS_OPTIONS.length - 1 ? SPACING.sm : 0,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: palette[g.accent],
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={{
                          color: active ? palette[g.accent] : palette.text,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '700',
                        }}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
                  marginTop: SPACING.md,
                  marginBottom: 6,
                }}
              >
                Estado del potrero
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {STATUS_OPTIONS.map((s, i) => {
                  const active = form.status === s.key;
                  const soft = palette[`${s.accent}Soft` as keyof typeof palette] as string;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setForm({ ...form, status: s.key })}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: active ? soft : palette.surface,
                        borderColor: active ? palette[s.accent] : palette.border,
                        borderWidth: 1,
                        marginRight: i < STATUS_OPTIONS.length - 1 ? SPACING.sm : 0,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? palette[s.accent] : palette.text,
                          fontSize: FONT_SIZE.xs,
                          fontWeight: '700',
                        }}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Input
                testID="nuevo-potrero-capacity"
                label="Capacidad (animales)"
                value={form.capacity}
                onChangeText={(v) => setForm({ ...form, capacity: v })}
                keyboardType="numeric"
                placeholder="20"
                containerStyle={{ marginTop: SPACING.md }}
              />

              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
                  marginTop: SPACING.md,
                  marginBottom: 6,
                }}
              >
                Coordenadas GPS
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    testID="nuevo-potrero-lat"
                    value={form.center_lat}
                    onChangeText={(v) => setForm({ ...form, center_lat: v })}
                    keyboardType="numeric"
                    placeholder="Lat 4.609"
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    testID="nuevo-potrero-lng"
                    value={form.center_lng}
                    onChangeText={(v) => setForm({ ...form, center_lng: v })}
                    keyboardType="numeric"
                    placeholder="Lng -74.082"
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
              </View>

              <Input
                testID="nuevo-potrero-notes"
                label="Notas"
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                placeholder="Observaciones…"
                multiline
                style={{ height: 88, textAlignVertical: 'top', paddingTop: 10 }}
                containerStyle={{ marginTop: SPACING.md }}
              />

              <Button
                testID="nuevo-potrero-submit"
                label="Guardar potrero"
                variant="accent"
                size="lg"
                loading={saving}
                onPress={handleSubmit}
                style={{ marginTop: SPACING.lg }}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
