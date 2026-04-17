import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  getAnimal,
  deleteAnimal,
  getHealthRecords,
  getWeightRecords,
  addHealthRecord,
  addWeightRecord,
} from '../../src/api';
import {
  ANIMAL_STATUS_LABEL,
  ANIMAL_TYPE_ACCENT,
  AccentKey,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Pill,
  ScreenBackground,
  Section,
} from '../../src/ui';

const HEALTH_TYPES: {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: AccentKey;
}[] = [
  { key: 'vacuna', label: 'Vacuna', icon: 'medkit', accent: 'green' },
  { key: 'tratamiento', label: 'Tratamiento', icon: 'bandage', accent: 'orange' },
  { key: 'revision', label: 'Revisión', icon: 'eye', accent: 'accent' },
  { key: 'enfermedad', label: 'Enfermedad', icon: 'warning', accent: 'red' },
];

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();

  const [animal, setAnimal] = useState<any>(null);
  const [health, setHealth] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'salud' | 'peso'>('info');

  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [healthForm, setHealthForm] = useState({
    record_type: 'vacuna',
    description: '',
    date: '',
    veterinarian: '',
  });
  const [weightForm, setWeightForm] = useState({ weight: '', date: '', notes: '' });
  const [savingHealth, setSavingHealth] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [aRes, hRes, wRes] = await Promise.all([
        getAnimal(id!),
        getHealthRecords(id!),
        getWeightRecords(id!),
      ]);
      setAnimal(aRes.data);
      setHealth(hRes.data);
      setWeights(wRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnimal(id!);
      router.back();
    } catch {
      /* ignore */
    }
  };

  const handleAddHealth = async () => {
    if (!healthForm.description) return;
    setSavingHealth(true);
    try {
      await addHealthRecord(id!, healthForm);
      setShowHealthModal(false);
      setHealthForm({ record_type: 'vacuna', description: '', date: '', veterinarian: '' });
      fetchData();
    } catch {
      /* ignore */
    } finally {
      setSavingHealth(false);
    }
  };

  const handleAddWeight = async () => {
    if (!weightForm.weight) return;
    setSavingWeight(true);
    try {
      await addWeightRecord(id!, {
        ...weightForm,
        weight: parseFloat(weightForm.weight),
      });
      setShowWeightModal(false);
      setWeightForm({ weight: '', date: '', notes: '' });
      fetchData();
    } catch {
      /* ignore */
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.accent} />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!animal) {
    return (
      <ScreenBackground>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.base }}>
            Animal no encontrado
          </Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const typeAccent: AccentKey = ANIMAL_TYPE_ACCENT[animal.animal_type] || 'accent';
  const statusEntry = ANIMAL_STATUS_LABEL[animal.status] || { label: 'Activo', accent: 'green' as AccentKey };
  const statusLabel = statusEntry.label;
  const statusAccent: AccentKey = statusEntry.accent;
  const accentColor = palette[typeAccent];
  const accentSoft = palette[`${typeAccent}Soft` as keyof typeof palette] as string;

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'info', label: 'Información' },
    { key: 'salud', label: 'Salud' },
    { key: 'peso', label: 'Peso' },
  ];

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
            testID="animal-detail-back"
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
            {animal.name}
          </Text>
          <Pressable
            testID="animal-detail-delete"
            onPress={handleDelete}
            style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: palette.redSoft,
              backgroundColor: palette.redSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={16} color={palette.red} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }}
        >
          {/* Hero */}
          <Card padding={SPACING.lg} style={{ marginTop: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: accentSoft,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={animal.sex === 'macho' ? 'male' : 'female'}
                  size={28}
                  color={accentColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text
                  style={{
                    color: palette.text,
                    fontSize: FONT_SIZE.xxl,
                    fontWeight: '800',
                    letterSpacing: -0.4,
                  }}
                >
                  {animal.name}
                </Text>
                <Text
                  style={{
                    color: palette.textSecondary,
                    fontSize: FONT_SIZE.sm,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  #{animal.tag_id || 'Sin arete'}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <Pill label={statusLabel} accent={statusAccent} />
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: SPACING.md,
                paddingTop: SPACING.md,
                borderTopWidth: 1,
                borderTopColor: palette.border,
              }}
            >
              {[
                { label: 'Raza', value: animal.breed || '-' },
                { label: 'Peso', value: `${animal.weight || 0} kg` },
                { label: 'Nacimiento', value: animal.birth_date || '-' },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: FONT_SIZE.sm,
                      fontWeight: '700',
                    }}
                  >
                    {s.value}
                  </Text>
                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.xs,
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginTop: SPACING.md }}>
            {tabs.map((t, i) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  testID={`animal-tab-${t.key}`}
                  onPress={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: RADIUS.pill,
                    backgroundColor: active ? palette.text : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? palette.text : palette.border,
                    alignItems: 'center',
                    marginRight: i < tabs.length - 1 ? SPACING.sm : 0,
                  }}
                >
                  <Text
                    style={{
                      color: active ? palette.background : palette.textSecondary,
                      fontSize: FONT_SIZE.sm,
                      fontWeight: '700',
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          {tab === 'info' && (
            <Card padding={SPACING.md} style={{ marginTop: SPACING.md }}>
              {[
                ['Sexo', animal.sex === 'macho' ? 'Macho' : 'Hembra'],
                ['Tipo', animal.animal_type || '-'],
                ['Notas', animal.notes || 'Sin notas'],
                ['Potrero', animal.paddock_name || animal.paddock_id || 'Sin asignar'],
                ['Registrado', animal.created_at?.split('T')[0] || '-'],
              ].map(([label, value], i, arr) => (
                <View key={label}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      paddingVertical: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.textSecondary,
                        fontSize: FONT_SIZE.sm,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        color: palette.text,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: '600',
                        maxWidth: '60%',
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </Text>
                  </View>
                  {i < arr.length - 1 && (
                    <View style={{ height: 1, backgroundColor: palette.border }} />
                  )}
                </View>
              ))}
            </Card>
          )}

          {tab === 'salud' && (
            <View style={{ marginTop: SPACING.md }}>
              <Section
                title="Historial sanitario"
                subtitle={`${health.length} registros`}
                action={
                  <Button
                    testID="animal-add-health"
                    label="Agregar"
                    size="sm"
                    variant="accent"
                    icon={<Ionicons name="add" size={14} color={palette.accentFg} />}
                    onPress={() => setShowHealthModal(true)}
                  />
                }
              >
                {health.length === 0 ? (
                  <Card padding={SPACING.lg}>
                    <EmptyState
                      icon={
                        <Ionicons name="medkit-outline" size={28} color={palette.textSecondary} />
                      }
                      title="Sin registros sanitarios"
                      subtitle="Agrega vacunas, tratamientos o revisiones."
                    />
                  </Card>
                ) : (
                  health.map((h, i) => {
                    const ht =
                      HEALTH_TYPES.find((t) => t.key === h.record_type) || HEALTH_TYPES[0];
                    const htSoft = palette[`${ht.accent}Soft` as keyof typeof palette] as string;
                    return (
                      <Card
                        key={h.record_id || i}
                        padding={SPACING.md}
                        style={{ marginBottom: SPACING.sm }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              backgroundColor: htSoft,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Ionicons
                              name={ht.icon}
                              size={18}
                              color={palette[ht.accent]}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: SPACING.md }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text
                                style={{
                                  color: palette.textSecondary,
                                  fontSize: FONT_SIZE.xs,
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                {ht.label}
                              </Text>
                              <Text
                                style={{
                                  color: palette.textTertiary,
                                  fontSize: FONT_SIZE.xs,
                                }}
                              >
                                {h.date || ''}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: palette.text,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: '700',
                                marginTop: 2,
                              }}
                            >
                              {h.description}
                            </Text>
                            {!!h.veterinarian && (
                              <Text
                                style={{
                                  color: palette.textSecondary,
                                  fontSize: FONT_SIZE.xs,
                                  marginTop: 2,
                                }}
                              >
                                {h.veterinarian}
                              </Text>
                            )}
                          </View>
                        </View>
                      </Card>
                    );
                  })
                )}
              </Section>
            </View>
          )}

          {tab === 'peso' && (
            <View style={{ marginTop: SPACING.md }}>
              <Section
                title="Registro de peso"
                subtitle={`${weights.length} pesajes`}
                action={
                  <Button
                    testID="animal-add-weight"
                    label="Registrar"
                    size="sm"
                    variant="accent"
                    icon={<Ionicons name="add" size={14} color={palette.accentFg} />}
                    onPress={() => setShowWeightModal(true)}
                  />
                }
              >
                {weights.length === 0 ? (
                  <Card padding={SPACING.lg}>
                    <EmptyState
                      icon={
                        <Ionicons name="fitness-outline" size={28} color={palette.textSecondary} />
                      }
                      title="Sin pesajes"
                      subtitle="Registra el peso para llevar el historial."
                    />
                  </Card>
                ) : (
                  weights.map((w, i) => (
                    <Card
                      key={w.record_id || i}
                      padding={SPACING.md}
                      style={{ marginBottom: SPACING.sm }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: palette.greenSoft,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="fitness" size={18} color={palette.green} />
                        </View>
                        <View style={{ flex: 1, marginLeft: SPACING.md }}>
                          <Text
                            style={{
                              color: palette.text,
                              fontSize: FONT_SIZE.base,
                              fontWeight: '800',
                            }}
                          >
                            {w.weight} kg
                          </Text>
                          <Text
                            style={{
                              color: palette.textSecondary,
                              fontSize: FONT_SIZE.xs,
                              marginTop: 2,
                            }}
                          >
                            {w.date}
                            {w.notes ? ` · ${w.notes}` : ''}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  ))
                )}
              </Section>
            </View>
          )}
        </ScrollView>

        {/* Health modal */}
        <Modal visible={showHealthModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                backgroundColor: palette.background,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.lg,
                paddingBottom: SPACING.xl,
                maxHeight: '85%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                <Text
                  style={{
                    color: palette.text,
                    fontSize: FONT_SIZE.xl,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                  }}
                >
                  Registro sanitario
                </Text>
                <Pressable
                  onPress={() => setShowHealthModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={palette.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
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
                  {HEALTH_TYPES.map((ht) => {
                    const active = healthForm.record_type === ht.key;
                    const soft = palette[`${ht.accent}Soft` as keyof typeof palette] as string;
                    return (
                      <Pressable
                        key={ht.key}
                        onPress={() => setHealthForm({ ...healthForm, record_type: ht.key })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: RADIUS.pill,
                          backgroundColor: active ? soft : 'transparent',
                          borderColor: active ? palette[ht.accent] : palette.border,
                          borderWidth: 1,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name={ht.icon}
                          size={14}
                          color={active ? palette[ht.accent] : palette.textSecondary}
                        />
                        <Text
                          style={{
                            color: active ? palette[ht.accent] : palette.textSecondary,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: '600',
                            marginLeft: 4,
                          }}
                        >
                          {ht.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Input
                  label="Descripción *"
                  value={healthForm.description}
                  onChangeText={(v) => setHealthForm({ ...healthForm, description: v })}
                  placeholder="Detalle del registro"
                  containerStyle={{ marginTop: SPACING.md }}
                />
                <Input
                  label="Veterinario"
                  value={healthForm.veterinarian}
                  onChangeText={(v) => setHealthForm({ ...healthForm, veterinarian: v })}
                  placeholder="Nombre del veterinario"
                />
                <Input
                  label="Fecha (YYYY-MM-DD)"
                  value={healthForm.date}
                  onChangeText={(v) => setHealthForm({ ...healthForm, date: v })}
                  placeholder="2025-01-15"
                />

                <Button
                  testID="animal-health-submit"
                  label="Guardar registro"
                  variant="accent"
                  size="lg"
                  loading={savingHealth}
                  onPress={handleAddHealth}
                  style={{ marginTop: SPACING.lg }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Weight modal */}
        <Modal visible={showWeightModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                backgroundColor: palette.background,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.lg,
                paddingBottom: SPACING.xl,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                <Text
                  style={{
                    color: palette.text,
                    fontSize: FONT_SIZE.xl,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                  }}
                >
                  Registrar peso
                </Text>
                <Pressable
                  onPress={() => setShowWeightModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={palette.text} />
                </Pressable>
              </View>

              <Input
                label="Peso (kg) *"
                value={weightForm.weight}
                onChangeText={(v) => setWeightForm({ ...weightForm, weight: v })}
                keyboardType="numeric"
                placeholder="450"
              />
              <Input
                label="Notas"
                value={weightForm.notes}
                onChangeText={(v) => setWeightForm({ ...weightForm, notes: v })}
                placeholder="Notas adicionales"
              />
              <Input
                label="Fecha (YYYY-MM-DD)"
                value={weightForm.date}
                onChangeText={(v) => setWeightForm({ ...weightForm, date: v })}
                placeholder="2025-01-15"
              />

              <Button
                testID="animal-weight-submit"
                label="Guardar peso"
                variant="accent"
                size="lg"
                loading={savingWeight}
                onPress={handleAddWeight}
                style={{ marginTop: SPACING.lg }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}
