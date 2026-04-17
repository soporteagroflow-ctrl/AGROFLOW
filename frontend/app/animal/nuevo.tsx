import { useState, useEffect } from 'react';
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

import { createAnimal, getPaddocks } from '../../src/api';
import { useToastStore } from '../../src/store';
import { FONT_SIZE, RADIUS, SPACING } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { Button, Card, Input, ScreenBackground, Section } from '../../src/ui';

const TYPES = [
  { key: 'vaca', label: 'Vaca', icon: 'female' as const },
  { key: 'toro', label: 'Toro', icon: 'male' as const },
  { key: 'ternero', label: 'Ternero', icon: 'happy' as const },
  { key: 'novilla', label: 'Novilla', icon: 'flower' as const },
];

export default function NuevoAnimalScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const toast = useToastStore();
  const [saving, setSaving] = useState(false);
  const [paddocks, setPaddocks] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    tag_id: '',
    breed: '',
    animal_type: 'vaca',
    birth_date: '',
    weight: '',
    sex: 'hembra',
    paddock_id: '',
    notes: '',
  });

  useEffect(() => {
    getPaddocks()
      .then((r) => setPaddocks(r.data))
      .catch(() => toast.show('No se pudieron cargar los potreros', 'warning'));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (form.weight && isNaN(Number(form.weight))) e.weight = 'Peso debe ser un número';
    if (form.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date))
      e.birth_date = 'Formato: YYYY-MM-DD';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createAnimal({ ...form, weight: form.weight ? parseFloat(form.weight) : 0 });
      toast.show('Animal registrado exitosamente', 'success');
      router.back();
    } catch {
      toast.show('Error al guardar el animal. Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
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
            testID="nuevo-animal-back"
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
            Nuevo animal
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
                testID="nuevo-animal-name"
                label="Nombre *"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Nombre del animal"
                error={errors.name}
              />

              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                Tipo
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {TYPES.map((t) => {
                  const active = form.animal_type === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      testID={`nuevo-animal-type-${t.key}`}
                      onPress={() => setForm({ ...form, animal_type: t.key })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
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
                      <Ionicons
                        name={t.icon}
                        size={14}
                        color={active ? palette.background : palette.textSecondary}
                      />
                      <Text
                        style={{
                          color: active ? palette.background : palette.textSecondary,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '600',
                          marginLeft: 4,
                        }}
                      >
                        {t.label}
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
                Sexo
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {[
                  { key: 'hembra', label: 'Hembra', icon: 'female' as const },
                  { key: 'macho', label: 'Macho', icon: 'male' as const },
                ].map((s, i) => {
                  const active = form.sex === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      testID={`nuevo-animal-sex-${s.key}`}
                      onPress={() => setForm({ ...form, sex: s.key })}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: active ? palette.accent : palette.surface,
                        borderColor: active ? palette.accent : palette.border,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: i === 0 ? SPACING.sm : 0,
                      }}
                    >
                      <Ionicons
                        name={s.icon}
                        size={16}
                        color={active ? palette.accentFg : palette.textSecondary}
                      />
                      <Text
                        style={{
                          color: active ? palette.accentFg : palette.text,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '700',
                          marginLeft: 6,
                        }}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ marginTop: SPACING.md }}>
                <Input
                  testID="nuevo-animal-tag"
                  label="Número de arete"
                  value={form.tag_id}
                  onChangeText={(v) => setForm({ ...form, tag_id: v })}
                  placeholder="A001"
                />
                <Input
                  testID="nuevo-animal-breed"
                  label="Raza"
                  value={form.breed}
                  onChangeText={(v) => setForm({ ...form, breed: v })}
                  placeholder="Angus, Brahman, Holstein…"
                />
                <Input
                  testID="nuevo-animal-weight"
                  label="Peso (kg)"
                  value={form.weight}
                  onChangeText={(v) => setForm({ ...form, weight: v })}
                  keyboardType="numeric"
                  placeholder="450"
                  error={errors.weight}
                />
                <Input
                  testID="nuevo-animal-birth"
                  label="Fecha de nacimiento (YYYY-MM-DD)"
                  value={form.birth_date}
                  onChangeText={(v) => setForm({ ...form, birth_date: v })}
                  placeholder="2022-01-15"
                  error={errors.birth_date}
                />
              </View>

              {paddocks.length > 0 && (
                <>
                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.sm,
                      fontWeight: '600',
                      marginTop: SPACING.md,
                      marginBottom: 6,
                    }}
                  >
                    Potrero
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Pressable
                      onPress={() => setForm({ ...form, paddock_id: '' })}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: RADIUS.pill,
                        backgroundColor: !form.paddock_id ? palette.text : 'transparent',
                        borderColor: !form.paddock_id ? palette.text : palette.border,
                        borderWidth: 1,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: !form.paddock_id ? palette.background : palette.textSecondary,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '600',
                        }}
                      >
                        Sin asignar
                      </Text>
                    </Pressable>
                    {paddocks.map((p) => {
                      const active = form.paddock_id === p.paddock_id;
                      return (
                        <Pressable
                          key={p.paddock_id}
                          onPress={() => setForm({ ...form, paddock_id: p.paddock_id })}
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
                            {p.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Input
                testID="nuevo-animal-notes"
                label="Notas"
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                placeholder="Observaciones…"
                multiline
                style={{ height: 88, textAlignVertical: 'top', paddingTop: 10 }}
                containerStyle={{ marginTop: SPACING.md }}
              />

              <Button
                testID="nuevo-animal-submit"
                label="Guardar animal"
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
