import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getFinances,
  createFinance,
  getFinanceSummary,
  deleteFinance,
} from '../../src/api';
import { useToastStore } from '../../src/store';
import {
  FINANCE_CATEGORIES,
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
  MetricCard,
  Pill,
  ScreenBackground,
  Section,
} from '../../src/ui';

export default function FinanzasScreen() {
  const { palette } = useTheme();
  const toast = useToastStore();
  const [finances, setFinances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    transaction_type: 'gasto',
    category: 'compra_alimento',
    amount: '',
    description: '',
    date: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [fRes, sRes] = await Promise.all([getFinances(), getFinanceSummary()]);
      setFinances(fRes.data);
      setSummary(sRes.data);
    } catch {
      toast.show('Error al cargar las finanzas', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmit = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.show('Ingresa un monto válido mayor a 0', 'warning');
      return;
    }
    if (form.date && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      toast.show('Formato de fecha inválido (YYYY-MM-DD)', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      await createFinance({ ...form, amount: parseFloat(form.amount) });
      toast.show('Registro financiero guardado', 'success');
      setShowModal(false);
      setForm({
        transaction_type: 'gasto',
        category: 'compra_alimento',
        amount: '',
        description: '',
        date: '',
      });
      await fetchData();
    } catch {
      toast.show('Error al guardar el registro', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFinance(id);
      toast.show('Registro eliminado', 'success');
      await fetchData();
    } catch {
      toast.show('Error al eliminar el registro', 'error');
    }
  };

  const categories = Object.keys(FINANCE_CATEGORIES);

  const renderFinance = ({ item }: { item: any }) => {
    const isIncome = item.transaction_type === 'ingreso';
    const accent = isIncome ? palette.green : palette.red;
    const accentSoft = isIncome ? palette.greenSoft : palette.redSoft;
    return (
      <Card
        style={{ marginBottom: SPACING.sm }}
        padding={SPACING.md}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: accentSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name={isIncome ? 'arrow-up' : 'arrow-down'}
              size={18}
              color={accent}
            />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text
              style={{ color: palette.text, fontSize: FONT_SIZE.sm, fontWeight: '700' }}
            >
              {FINANCE_CATEGORIES[item.category] || item.category}
            </Text>
            <Text
              style={{ color: palette.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 }}
            >
              {item.description || 'Sin descripción'}
            </Text>
            <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs, marginTop: 1 }}>
              {item.date}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                color: accent,
                fontSize: FONT_SIZE.base,
                fontWeight: '700',
              }}
            >
              {isIncome ? '+' : '-'}${(item.amount || 0).toLocaleString()}
            </Text>
            <Pressable
              onPress={() => handleDelete(item.finance_id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginTop: 4 }}
            >
              <Ionicons name="trash-outline" size={14} color={palette.textTertiary} />
            </Pressable>
          </View>
        </View>
      </Card>
    );
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

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.text,
                  fontSize: FONT_SIZE.xxxl,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                }}
              >
                Finanzas
              </Text>
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  marginTop: 2,
                }}
              >
                {summary?.transaction_count || 0} transacciones
              </Text>
            </View>
            <Button
              label="Nuevo"
              icon={<Ionicons name="add" size={14} color={palette.btnPrimaryFg} />}
              size="sm"
              variant="primary"
              onPress={() => setShowModal(true)}
            />
          </View>
        </View>

        {summary && (
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: SPACING.lg,
              marginTop: SPACING.md,
            }}
          >
            {[
              {
                label: 'Ingresos',
                value: `$${((summary.total_income || 0) / 1_000_000).toFixed(1)}M`,
                accent: 'green' as const,
              },
              {
                label: 'Gastos',
                value: `$${((summary.total_expense || 0) / 1_000_000).toFixed(1)}M`,
                accent: 'red' as const,
              },
              {
                label: 'Ganancia',
                value: `$${((summary.profit || 0) / 1_000_000).toFixed(1)}M`,
                accent: 'accent' as const,
              },
            ].map((s, i) => (
              <View
                key={s.label}
                style={{ flex: 1, marginRight: i < 2 ? SPACING.sm : 0 }}
              >
                <MetricCard label={s.label} value={s.value} accent={s.accent} />
              </View>
            ))}
          </View>
        )}

        <FlatList
          data={finances}
          keyExtractor={(item) => item.finance_id}
          renderItem={renderFinance}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.xl,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="cash-outline" size={28} color={palette.textTertiary} />}
              title="Sin registros"
              subtitle="Agrega tu primer ingreso o gasto para ver el resumen."
            />
          }
        />

        <Modal visible={showModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                backgroundColor: palette.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: SPACING.lg,
                maxHeight: '88%',
                borderTopWidth: 1,
                borderColor: palette.border,
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
                  Nuevo registro
                </Text>
                <Pressable onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={22} color={palette.text} />
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
                <View style={{ flexDirection: 'row' }}>
                  {[
                    { key: 'ingreso', label: 'Ingreso', accent: palette.green },
                    { key: 'gasto', label: 'Gasto', accent: palette.red },
                  ].map((t) => {
                    const active = form.transaction_type === t.key;
                    return (
                      <Pressable
                        key={t.key}
                        testID={`finance-type-${t.key}`}
                        onPress={() => setForm({ ...form, transaction_type: t.key })}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: RADIUS.md,
                          backgroundColor: active ? t.accent : palette.surface,
                          borderColor: active ? t.accent : palette.border,
                          borderWidth: 1,
                          marginRight: t.key === 'ingreso' ? SPACING.sm : 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={t.key === 'ingreso' ? 'arrow-up' : 'arrow-down'}
                          size={16}
                          color={active ? '#FFFFFF' : t.accent}
                        />
                        <Text
                          style={{
                            color: active ? '#FFFFFF' : palette.text,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: '700',
                            marginLeft: 6,
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
                  Categoría
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {categories.map((cat) => {
                    const active = form.category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setForm({ ...form, category: cat })}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: RADIUS.pill,
                          backgroundColor: active ? palette.text : 'transparent',
                          borderColor: active ? palette.text : palette.border,
                          borderWidth: 1,
                          marginRight: 6,
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: active ? palette.background : palette.textSecondary,
                            fontSize: FONT_SIZE.xs,
                            fontWeight: '600',
                          }}
                        >
                          {FINANCE_CATEGORIES[cat]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: SPACING.md }}>
                  <Input
                    label="Monto ($)"
                    testID="finance-amount-input"
                    value={form.amount}
                    onChangeText={(v) => setForm({ ...form, amount: v })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Input
                    label="Descripción"
                    testID="finance-desc-input"
                    value={form.description}
                    onChangeText={(v) => setForm({ ...form, description: v })}
                    placeholder="Descripción del registro"
                  />
                  <Input
                    label="Fecha (YYYY-MM-DD)"
                    testID="finance-date-input"
                    value={form.date}
                    onChangeText={(v) => setForm({ ...form, date: v })}
                    placeholder="2026-01-15"
                  />
                </View>

                <Button
                  testID="finance-submit-btn"
                  label="Guardar registro"
                  variant="accent"
                  size="lg"
                  loading={submitting}
                  onPress={handleSubmit}
                  style={{ marginTop: SPACING.lg, marginBottom: SPACING.xl }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}
