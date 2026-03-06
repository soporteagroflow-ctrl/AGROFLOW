import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAlerts } from '../src/api';
import { COLORS, SPACING, FONT_SIZE } from '../src/theme';

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  alta: { color: '#CF6679', bg: '#CF667920', label: 'URGENTE' },
  media: { color: '#FFA726', bg: '#FFA72620', label: 'MEDIA' },
  baja: { color: '#42A5F5', bg: '#42A5F520', label: 'BAJA' },
};

const ALERT_TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  vacunacion_pendiente: { icon: 'medkit', label: 'Vacunación Pendiente' },
  parto_proximo: { icon: 'heart', label: 'Parto Próximo' },
  potrero_saturado: { icon: 'alert', label: 'Potrero Saturado' },
  pasto_deteriorado: { icon: 'leaf', label: 'Pasto Deteriorado' },
  revision_pendiente: { icon: 'eye', label: 'Revisión Pendiente' },
};

export default function AlertasScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('todas');

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data.alerts || []);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAlerts(); };

  const filtered = filterSeverity === 'todas'
    ? alerts
    : alerts.filter(a => a.severity === filterSeverity);

  const counts = {
    alta: alerts.filter(a => a.severity === 'alta').length,
    media: alerts.filter(a => a.severity === 'media').length,
    baja: alerts.filter(a => a.severity === 'baja').length,
  };

  const renderAlert = ({ item }: { item: any }) => {
    const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.baja;
    const type = ALERT_TYPE_CONFIG[item.type] || { icon: 'alert', label: item.type };
    return (
      <TouchableOpacity
        testID={`alert-item-${item.alert_id}`}
        style={[styles.alertCard, { borderLeftColor: sev.color }]}
        onPress={() => {
          if (item.animal_id) router.push(`/animal/${item.animal_id}`);
          else if (item.paddock_id) router.push(`/potrero/${item.paddock_id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.alertIcon, { backgroundColor: sev.bg }]}>
          <Ionicons name={type.icon as any} size={22} color={sev.color} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTopRow}>
            <Text style={styles.alertType}>{type.label}</Text>
            <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
              <Text style={[styles.severityText, { color: sev.color }]}>{sev.label}</Text>
            </View>
          </View>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.alertDesc}>{item.description}</Text>
          <Text style={styles.alertDate}>{item.date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="alertas-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: '#CF6679' }]}>
          <Text style={[styles.summaryNumber, { color: '#CF6679' }]}>{counts.alta}</Text>
          <Text style={styles.summaryLabel}>Urgentes</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: '#FFA726' }]}>
          <Text style={[styles.summaryNumber, { color: '#FFA726' }]}>{counts.media}</Text>
          <Text style={styles.summaryLabel}>Media</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: '#42A5F5' }]}>
          <Text style={[styles.summaryNumber, { color: '#42A5F5' }]}>{counts.baja}</Text>
          <Text style={styles.summaryLabel}>Baja</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {[{ key: 'todas', label: 'Todas' }, { key: 'alta', label: 'Urgentes' }, { key: 'media', label: 'Media' }, { key: 'baja', label: 'Baja' }].map(f => (
          <TouchableOpacity
            key={f.key}
            testID={`alertas-filter-${f.key}`}
            style={[styles.filterChip, filterSeverity === f.key && styles.filterChipActive]}
            onPress={() => setFilterSeverity(f.key)}
          >
            <Text style={[styles.filterChipText, filterSeverity === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => item.alert_id || `alert_${i}`}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>¡Todo en orden!</Text>
            <Text style={styles.emptyText}>No hay alertas pendientes</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  summaryRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  summaryNumber: { fontSize: FONT_SIZE.xxxl, fontWeight: '800' },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.xs },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 40 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  alertIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  alertContent: { flex: 1, marginLeft: SPACING.sm },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertType: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '800' },
  alertTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  alertDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  alertDate: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});
