import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import { getDashboard, seedData, getAlerts } from '../../src/api';
import { cacheData, getCachedData, isOnline, CACHE_KEYS } from '../../src/offline';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

const screenWidth = Dimensions.get('window').width;

const SEVERITY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  alta: { color: '#CF6679', icon: 'alert-circle', label: 'Alta' },
  media: { color: '#FFA726', icon: 'warning', label: 'Media' },
  baja: { color: '#42A5F5', icon: 'information-circle', label: 'Baja' },
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  vacunacion_pendiente: 'medkit',
  parto_proximo: 'heart',
  potrero_saturado: 'alert',
  pasto_deteriorado: 'leaf',
  revision_pendiente: 'eye',
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchData = useCallback(async () => {
    const online = await isOnline();
    setOffline(!online);

    if (online) {
      try {
        const [dashRes, alertRes] = await Promise.all([getDashboard(), getAlerts()]);
        setData(dashRes.data);
        setAlerts(alertRes.data.alerts || []);
        setAlertCount(alertRes.data.count || 0);
        cacheData(CACHE_KEYS.dashboard, dashRes.data);
        cacheData(CACHE_KEYS.alerts, alertRes.data);
      } catch (e) {
        console.log('Dashboard error:', e);
        const cached = await getCachedData(CACHE_KEYS.dashboard);
        const cachedAlerts = await getCachedData(CACHE_KEYS.alerts);
        if (cached) setData(cached);
        if (cachedAlerts) { setAlerts(cachedAlerts.alerts || []); setAlertCount(cachedAlerts.count || 0); }
      }
    } else {
      const cached = await getCachedData(CACHE_KEYS.dashboard);
      const cachedAlerts = await getCachedData(CACHE_KEYS.alerts);
      if (cached) setData(cached);
      if (cachedAlerts) { setAlerts(cachedAlerts.alerts || []); setAlertCount(cachedAlerts.count || 0); }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSeed = async () => {
    setSeeding(true);
    try { await seedData(); fetchData(); }
    catch (e) { console.log('Seed error:', e); }
    finally { setSeeding(false); }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
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

  const highAlerts = alerts.filter(a => a.severity === 'alta');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Offline Banner */}
        {offline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={16} color={COLORS.white} />
            <Text style={styles.offlineText}>Modo sin conexión - datos en caché</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || 'Ganadero'}</Text>
            <Text style={styles.farmName}>{user?.farm_name || 'Mi Finca'}</Text>
          </View>
          {alertCount > 0 && (
            <TouchableOpacity testID="dashboard-alerts-btn" style={styles.alertBadgeBtn} onPress={() => router.push('/alertas')}>
              <Ionicons name="notifications" size={22} color={COLORS.white} />
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{alertCount}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Critical Alerts */}
        {highAlerts.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={18} color="#CF6679" />
              <Text style={styles.alertSectionTitle}>Alertas Urgentes ({highAlerts.length})</Text>
            </View>
            {highAlerts.slice(0, 3).map((alert, i) => (
              <View key={alert.alert_id || i} testID={`dashboard-alert-${i}`} style={styles.alertCard}>
                <View style={[styles.alertIcon, { backgroundColor: '#CF667920' }]}>
                  <Ionicons name={(ALERT_TYPE_ICONS[alert.type] || 'alert') as any} size={18} color="#CF6679" />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDesc}>{alert.description}</Text>
                </View>
              </View>
            ))}
            {highAlerts.length > 3 && (
              <TouchableOpacity testID="dashboard-see-all-alerts" style={styles.seeAllBtn} onPress={() => router.push('/alertas')}>
                <Text style={styles.seeAllText}>Ver todas las alertas ({alertCount})</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
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

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Distribución del Hato</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{ color: () => COLORS.text, labelColor: () => COLORS.text }}
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

        {/* Finance */}
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
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D84315', paddingVertical: 8 },
  offlineText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  farmName: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  alertBadgeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  alertCountBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#CF6679', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertCountText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  alertSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  alertSectionTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: '#CF6679' },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.xs, borderLeftWidth: 3, borderLeftColor: '#CF6679', borderWidth: 1, borderColor: COLORS.border },
  alertIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: SPACING.sm },
  alertTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  alertDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm },
  seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
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
