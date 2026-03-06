import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFinances, createFinance, getFinanceSummary, deleteFinance } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE, FINANCE_CATEGORIES } from '../../src/theme';

export default function FinanzasScreen() {
  const [finances, setFinances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ transaction_type: 'gasto', category: 'compra_alimento', amount: '', description: '', date: '' });

  const fetchData = useCallback(async () => {
    try {
      const [fRes, sRes] = await Promise.all([getFinances(), getFinanceSummary()]);
      setFinances(fRes.data);
      setSummary(sRes.data);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSubmit = async () => {
    if (!form.amount) return;
    try {
      await createFinance({ ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
      setForm({ transaction_type: 'gasto', category: 'compra_alimento', amount: '', description: '', date: '' });
      fetchData();
    } catch (e) { console.log('Error:', e); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteFinance(id); fetchData(); } catch (e) { console.log('Error:', e); }
  };

  const categories = [
    'venta_ganado', 'venta_leche', 'compra_alimento', 'veterinario', 'mantenimiento', 'personal', 'transporte', 'otros'
  ];

  const renderFinance = ({ item }: { item: any }) => {
    const isIncome = item.transaction_type === 'ingreso';
    return (
      <View testID={`finance-item-${item.finance_id}`} style={styles.financeCard}>
        <View style={[styles.financeIcon, { backgroundColor: isIncome ? '#4CAF5020' : '#CF667920' }]}>
          <Ionicons name={isIncome ? 'arrow-up' : 'arrow-down'} size={20} color={isIncome ? '#4CAF50' : '#CF6679'} />
        </View>
        <View style={styles.financeInfo}>
          <Text style={styles.financeCat}>{FINANCE_CATEGORIES[item.category] || item.category}</Text>
          <Text style={styles.financeDesc}>{item.description || 'Sin descripción'}</Text>
          <Text style={styles.financeDate}>{item.date}</Text>
        </View>
        <View style={styles.financeRight}>
          <Text style={[styles.financeAmount, { color: isIncome ? '#4CAF50' : '#CF6679' }]}>
            {isIncome ? '+' : '-'}${(item.amount || 0).toLocaleString()}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.finance_id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finanzas</Text>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#4CAF50' }]}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>${((summary.total_income || 0) / 1000000).toFixed(1)}M</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#CF6679' }]}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryAmount, { color: '#CF6679' }]}>${((summary.total_expense || 0) / 1000000).toFixed(1)}M</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#42A5F5' }]}>
            <Text style={styles.summaryLabel}>Ganancia</Text>
            <Text style={[styles.summaryAmount, { color: '#42A5F5' }]}>${((summary.profit || 0) / 1000000).toFixed(1)}M</Text>
          </View>
        </View>
      )}

      <FlatList
        data={finances}
        keyExtractor={item => item.finance_id}
        renderItem={renderFinance}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No hay registros financieros</Text>
          </View>
        }
      />

      <TouchableOpacity testID="finanzas-add-btn" style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Finance Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Registro</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Selector */}
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  testID="finance-type-ingreso"
                  style={[styles.typeBtn, form.transaction_type === 'ingreso' && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, transaction_type: 'ingreso' })}
                >
                  <Ionicons name="arrow-up" size={18} color={form.transaction_type === 'ingreso' ? COLORS.white : '#4CAF50'} />
                  <Text style={[styles.typeBtnText, form.transaction_type === 'ingreso' && { color: COLORS.white }]}>Ingreso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="finance-type-gasto"
                  style={[styles.typeBtn, form.transaction_type === 'gasto' && styles.typeBtnActiveRed]}
                  onPress={() => setForm({ ...form, transaction_type: 'gasto' })}
                >
                  <Ionicons name="arrow-down" size={18} color={form.transaction_type === 'gasto' ? COLORS.white : '#CF6679'} />
                  <Text style={[styles.typeBtnText, form.transaction_type === 'gasto' && { color: COLORS.white }]}>Gasto</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.catGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, form.category === cat && styles.catChipActive]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    <Text style={[styles.catChipText, form.category === cat && styles.catChipTextActive]}>
                      {FINANCE_CATEGORIES[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Monto ($)</Text>
              <TextInput
                testID="finance-amount-input"
                style={styles.input}
                value={form.amount}
                onChangeText={v => setForm({ ...form, amount: v })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                testID="finance-desc-input"
                style={styles.input}
                value={form.description}
                onChangeText={v => setForm({ ...form, description: v })}
                placeholder="Descripción del registro"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
              <TextInput
                testID="finance-date-input"
                style={styles.input}
                value={form.date}
                onChangeText={v => setForm({ ...form, date: v })}
                placeholder="2025-01-15"
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity testID="finance-submit-btn" style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Guardar Registro</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  summaryRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  summaryAmount: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginTop: 4 },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 100 },
  financeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  financeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  financeInfo: { flex: 1, marginLeft: SPACING.sm },
  financeCat: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  financeDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  financeDate: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 1 },
  financeRight: { alignItems: 'flex-end', gap: 6 },
  financeAmount: { fontSize: FONT_SIZE.base, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.base, color: COLORS.muted },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeBtnActiveRed: { backgroundColor: '#CF6679', borderColor: '#CF6679' },
  typeBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  catChipTextActive: { color: COLORS.white },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 48, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  submitBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
