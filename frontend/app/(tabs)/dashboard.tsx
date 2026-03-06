import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuthStore } from '../../src/store';
import { getDashboard, seedData, getAIPrediction } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      console.log('Dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedData();
      fetchData();
    } catch (e) { console.log('Seed error:', e); }
    finally { setSeeding(false); }
  };

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await getAIPrediction('general', { question: 'Dame un consejo rápido para mejorar la productividad de mi finca ganadera hoy. Máximo 2 oraciones.' });
      setAiTip(res.data.prediction);
    } catch (e) { setAiTip('No se pudo obtener consejo IA.'); }
    finally { setAiLoading(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  const animals = data?.animals || {};
  const paddocks = data?.paddocks || {};
  const finance = data?.finance || {};

  const pieData = [
    { name: 'Vacas', population: animals.cows || 0, color: '#4CAF50', legendFontColor: COLORS.text, legendFontSize: 12 },
    { name: 'Toros', population: animals.bulls || 0, color: '#2196F3', legendFontColor: COLORS.text, legendFontSize: 12 },
    { name: 'Terneros', population: animals.calves || 0, color: '#FF9800', legendFontColor: COLORS.text, legendFontSize: 12 },
    { name: 'Novillas', population: animals.heifers || 0, color: '#E91E63', legendFontColor: COLORS.text, legendFontSize: 12 },
  ].filter(d => d.population > 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || 'Ganadero'}</Text>
            <Text style={styles.farmName}>{user?.farm_name || 'Mi Finca'}</Text>
          </View>
          <TouchableOpacity testID="dashboard-ai-tip-btn" style={styles.aiButton} onPress={handleAI}>
            <Ionicons name="sparkles" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* AI Tip */}
        {(aiTip || aiLoading) && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="sparkles" size={18} color={COLORS.secondary} />
              <Text style={styles.aiCardTitle}>Consejo IA</Text>
            </View>
            {aiLoading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={styles.aiCardText}>{aiTip}</Text>
            )}
          </View>
        )}

        {/* Empty state */}
        {animals.total === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="add-circle-outline" size={48} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>¡Comienza a usar RanchoPro!</Text>
            <Text style={styles.emptyText}>Agrega datos de ejemplo para explorar la app</Text>
            <TouchableOpacity testID="dashboard-seed-btn" style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
              {seeding ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.seedButtonText}>Cargar datos de ejemplo</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#1B5E20' }]}>
            <Ionicons name="paw" size={28} color={COLORS.white} />
            <Text style={styles.kpiNumber}>{animals.total || 0}</Text>
            <Text style={styles.kpiLabel}>Total Ganado</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#E65100' }]}>
            <Ionicons name="map" size={28} color={COLORS.white} />
            <Text style={styles.kpiNumber}>{paddocks.total || 0}</Text>
            <Text style={styles.kpiLabel}>Potreros</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#1565C0' }]}>
            <Ionicons name="fitness" size={28} color={COLORS.white} />
            <Text style={styles.kpiNumber}>{animals.avg_weight || 0}</Text>
            <Text style={styles.kpiLabel}>Peso Prom. (kg)</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#6A1B9A' }]}>
            <Ionicons name="trending-up" size={28} color={COLORS.white} />
            <Text style={styles.kpiNumber}>${((finance.profit || 0) / 1000000).toFixed(1)}M</Text>
            <Text style={styles.kpiLabel}>Rentabilidad</Text>
          </View>
        </View>

        {/* Animal Distribution Chart */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Distribución del Hato</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                color: () => COLORS.text,
                labelColor: () => COLORS.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Paddock Status */}
        {paddocks.total > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Estado de Potreros</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusLabel}>Activos: {paddocks.active}</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#FFA726' }]} />
                <Text style={styles.statusLabel}>Descanso: {paddocks.resting}</Text>
              </View>
            </View>
            <View style={styles.grassRow}>
              <Text style={styles.grassTitle}>Estado del Pasto:</Text>
              <View style={styles.grassBars}>
                <View style={[styles.grassBar, { flex: paddocks.grass_good || 1, backgroundColor: '#4CAF50' }]} />
                <View style={[styles.grassBar, { flex: paddocks.grass_regular || 1, backgroundColor: '#FFA726' }]} />
                <View style={[styles.grassBar, { flex: paddocks.grass_bad || 1, backgroundColor: '#CF6679' }]} />
              </View>
              <View style={styles.grassLabels}>
                <Text style={styles.grassLabel}>Bueno: {paddocks.grass_good}</Text>
                <Text style={styles.grassLabel}>Regular: {paddocks.grass_regular}</Text>
                <Text style={styles.grassLabel}>Malo: {paddocks.grass_bad}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Finance Summary */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Resumen Financiero</Text>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Ionicons name="arrow-up-circle" size={24} color="#4CAF50" />
              <Text style={styles.financeAmount}>${((finance.total_income || 0) / 1000000).toFixed(1)}M</Text>
              <Text style={styles.financeLabel}>Ingresos</Text>
            </View>
            <View style={styles.financeItem}>
              <Ionicons name="arrow-down-circle" size={24} color="#CF6679" />
              <Text style={styles.financeAmount}>${((finance.total_expense || 0) / 1000000).toFixed(1)}M</Text>
              <Text style={styles.financeLabel}>Gastos</Text>
            </View>
            <View style={styles.financeItem}>
              <Ionicons name="wallet" size={24} color="#42A5F5" />
              <Text style={styles.financeAmount}>${((finance.profit || 0) / 1000000).toFixed(1)}M</Text>
              <Text style={styles.financeLabel}>Ganancia</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  farmName: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  aiButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  aiCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.secondary },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiCardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.secondary },
  aiCardText: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 20 },
  emptyCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
  seedButton: { marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 4, borderRadius: 10 },
  seedButtonText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  kpiCard: { width: (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2, borderRadius: 16, padding: SPACING.md, minHeight: 110 },
  kpiNumber: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.white, marginTop: SPACING.sm },
  kpiLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  chartCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  chartTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  statusRow: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  grassRow: { marginTop: SPACING.sm },
  grassTitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 8 },
  grassBars: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  grassBar: { borderRadius: 4, minWidth: 4 },
  grassLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  grassLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  financeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  financeItem: { alignItems: 'center', gap: 4 },
  financeAmount: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  financeLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
});
