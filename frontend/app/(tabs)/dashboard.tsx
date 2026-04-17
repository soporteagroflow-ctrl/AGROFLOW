import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

import { useAuthStore, useToastStore } from '../../src/store';
import { getDashboard, seedData, getAlerts } from '../../src/api';
import { cacheData, getCachedData, isOnline, CACHE_KEYS } from '../../src/offline';
import { AccentKey, FONT_SIZE, RADIUS, SPACING } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import {
  Button,
  Card,
  EmptyState,
  MetricCard,
  Pill,
  ScreenBackground,
  Section,
  StatDot,
} from '../../src/ui';

const screenWidth = Dimensions.get('window').width;

const ALERT_TYPE_ICONS: Record<string, string> = {
  vacunacion_pendiente: 'medkit',
  parto_proximo: 'heart',
  potrero_saturado: 'alert',
  pasto_deteriorado: 'leaf',
  revision_pendiente: 'eye',
};

const SEVERITY_ACCENT: Record<string, AccentKey> = {
  alta: 'red',
  media: 'orange',
  baja: 'accent',
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const { palette, mode, toggleMode } = useTheme();
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
        const cached = await getCachedData(CACHE_KEYS.dashboard);
        const cachedAlerts = await getCachedData(CACHE_KEYS.alerts);
        if (cached) setData(cached);
        if (cachedAlerts) {
          setAlerts(cachedAlerts.alerts || []);
          setAlertCount(cachedAlerts.count || 0);
        }
      }
    } else {
      const cached = await getCachedData(CACHE_KEYS.dashboard);
      const cachedAlerts = await getCachedData(CACHE_KEYS.alerts);
      if (cached) setData(cached);
      if (cachedAlerts) {
        setAlerts(cachedAlerts.alerts || []);
        setAlertCount(cachedAlerts.count || 0);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedData();
      toast.show('Datos de ejemplo cargados exitosamente', 'success');
      await fetchData();
    } catch {
      toast.show('Error al cargar datos de ejemplo', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={palette.accent} />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const animals = data?.animals || {};
  const paddocks = data?.paddocks || {};
  const finance = data?.finance || {};

  const pieData = [
    { name: 'Vacas', population: animals.cows || 0, color: palette.accent, legendFontColor: palette.text, legendFontSize: 12 },
    { name: 'Toros', population: animals.bulls || 0, color: palette.purple, legendFontColor: palette.text, legendFontSize: 12 },
    { name: 'Terneros', population: animals.calves || 0, color: palette.orange, legendFontColor: palette.text, legendFontSize: 12 },
    { name: 'Novillas', population: animals.heifers || 0, color: palette.pink, legendFontColor: palette.text, legendFontSize: 12 },
  ].filter((d) => d.population > 0);

  const highAlerts = alerts.filter((a) => a.severity === 'alta');

  const firstName = user?.name?.split(' ')[0] || 'Ganadero';
  const farmName = user?.farm_name || 'Mi Finca';

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.accent}
            />
          }
          contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        >
          {/* Offline banner */}
          {offline && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                paddingHorizontal: SPACING.md,
                backgroundColor: palette.orangeSoft,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            >
              <Ionicons name="cloud-offline" size={14} color={palette.orange} />
              <Text style={{ marginLeft: 6, color: palette.orange, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>
                Modo sin conexión · mostrando datos en caché
              </Text>
            </View>
          )}

          {/* Top row: greeting + theme toggle + alerts bell */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: SPACING.lg,
              paddingTop: SPACING.lg,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm }}>
                Hola, {firstName}
              </Text>
              <Text
                style={{
                  color: palette.text,
                  fontSize: FONT_SIZE.xxl,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                  marginTop: 2,
                }}
              >
                {farmName}
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
                marginRight: 8,
              }}
            >
              <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={palette.text} />
            </Pressable>

            {alertCount > 0 && (
              <Pressable
                testID="dashboard-alerts-btn"
                onPress={() => router.push('/alertas')}
                style={{
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: RADIUS.pill,
                  backgroundColor: palette.redSoft,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="notifications" size={16} color={palette.red} />
                <Text
                  style={{
                    color: palette.red,
                    fontWeight: '700',
                    marginLeft: 6,
                    fontSize: FONT_SIZE.sm,
                  }}
                >
                  {alertCount}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Hero pill + subtitle */}
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Pill label="Panel general" accent="accent" style={{ marginRight: 6, marginBottom: 6 }} />
              <Pill label={`${animals.total || 0} animales`} accent="teal" style={{ marginRight: 6, marginBottom: 6 }} />
              <Pill label={`${paddocks.total || 0} potreros`} accent="orange" style={{ marginRight: 6, marginBottom: 6 }} />
            </View>
            <Text
              style={{
                color: palette.text,
                fontSize: FONT_SIZE.xxxl,
                fontWeight: '800',
                letterSpacing: -0.8,
                marginTop: SPACING.sm,
              }}
            >
              Tu finca hoy
            </Text>
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: FONT_SIZE.base,
                marginTop: 4,
                maxWidth: 520,
                lineHeight: FONT_SIZE.base * 1.5,
              }}
            >
              KPIs, alertas y finanzas en una sola vista. Desliza hacia abajo para refrescar.
            </Text>
          </View>

          {/* Empty state */}
          {animals.total === 0 && (
            <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
              <Card elevated>
                <EmptyState
                  icon={<Ionicons name="sparkles" size={28} color={palette.accent} />}
                  title="Comienza a usar AgroFlow"
                  subtitle="Carga datos de ejemplo para explorar la app en segundos."
                  action={
                    <Button
                      label={seeding ? 'Cargando…' : 'Cargar datos de ejemplo'}
                      onPress={handleSeed}
                      loading={seeding}
                      variant="accent"
                    />
                  }
                />
              </Card>
            </View>
          )}

          {/* Critical alerts */}
          {highAlerts.length > 0 && (
            <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
              <Section
                title="Alertas urgentes"
                subtitle={`${highAlerts.length} activas`}
                action={
                  alertCount > highAlerts.length ? (
                    <Button
                      label="Ver todas"
                      variant="ghost"
                      size="sm"
                      onPress={() => router.push('/alertas')}
                    />
                  ) : undefined
                }
              >
                {highAlerts.slice(0, 3).map((alert, i) => (
                  <Card
                    key={alert.alert_id || i}
                    style={{ marginBottom: SPACING.sm, borderColor: palette.red }}
                    padding={SPACING.md}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: palette.redSoft,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: SPACING.md,
                        }}
                      >
                        <Ionicons
                          name={(ALERT_TYPE_ICONS[alert.type] || 'alert') as any}
                          size={18}
                          color={palette.red}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: palette.text,
                            fontWeight: '700',
                            fontSize: FONT_SIZE.base,
                          }}
                        >
                          {alert.title}
                        </Text>
                        <Text
                          style={{
                            color: palette.textSecondary,
                            fontSize: FONT_SIZE.sm,
                            marginTop: 2,
                          }}
                        >
                          {alert.description}
                        </Text>
                      </View>
                      <Pill
                        label={SEVERITY_ACCENT[alert.severity] ? alert.severity : 'info'}
                        accent={SEVERITY_ACCENT[alert.severity] || 'accent'}
                      />
                    </View>
                  </Card>
                ))}
              </Section>
            </View>
          )}

          {/* KPI grid */}
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
            <Section title="Indicadores" subtitle="Resumen de tu operación">
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginHorizontal: -SPACING.xs,
                }}
              >
                {[
                  {
                    label: 'Total ganado',
                    value: animals.total || 0,
                    hint: `${animals.cows || 0} vacas · ${animals.bulls || 0} toros`,
                    accent: 'accent' as AccentKey,
                  },
                  {
                    label: 'Potreros',
                    value: paddocks.total || 0,
                    hint: `${paddocks.active || 0} activos · ${paddocks.resting || 0} descanso`,
                    accent: 'teal' as AccentKey,
                  },
                  {
                    label: 'Peso promedio',
                    value: `${animals.avg_weight || 0} kg`,
                    hint: 'Sobre animales activos',
                    accent: 'orange' as AccentKey,
                  },
                  {
                    label: 'Rentabilidad',
                    value: `$${((finance.profit || 0) / 1_000_000).toFixed(1)}M`,
                    hint: `Ingresos − gastos`,
                    accent: 'purple' as AccentKey,
                  },
                ].map((m) => (
                  <View
                    key={m.label}
                    style={{ width: '50%', paddingHorizontal: SPACING.xs, marginBottom: SPACING.sm }}
                  >
                    <MetricCard
                      label={m.label}
                      value={m.value}
                      hint={m.hint}
                      accent={m.accent}
                    />
                  </View>
                ))}
              </View>
            </Section>
          </View>

          {/* Herd distribution */}
          {pieData.length > 0 && (
            <View style={{ paddingHorizontal: SPACING.lg }}>
              <Section title="Distribución del hato">
                <Card>
                  <PieChart
                    data={pieData}
                    width={screenWidth - SPACING.lg * 2 - SPACING.lg * 2}
                    height={180}
                    chartConfig={{
                      color: () => palette.text,
                      labelColor: () => palette.text,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </Card>
              </Section>
            </View>
          )}

          {/* Paddock status */}
          {paddocks.total > 0 && (
            <View style={{ paddingHorizontal: SPACING.lg }}>
              <Section title="Potreros">
                <Card>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: SPACING.lg, marginBottom: 8 }}
                    >
                      <StatDot accent="green" />
                      <Text style={{ color: palette.text, marginLeft: 6, fontSize: FONT_SIZE.sm }}>
                        Activos: {paddocks.active}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: SPACING.lg, marginBottom: 8 }}
                    >
                      <StatDot accent="orange" />
                      <Text style={{ color: palette.text, marginLeft: 6, fontSize: FONT_SIZE.sm }}>
                        Descanso: {paddocks.resting}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.xs,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginTop: SPACING.md,
                    }}
                  >
                    Estado del pasto
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      height: 10,
                      marginTop: 8,
                      borderRadius: RADIUS.pill,
                      overflow: 'hidden',
                      backgroundColor: palette.surfaceElevated,
                    }}
                  >
                    <View
                      style={{
                        flex: paddocks.grass_good || 0.0001,
                        backgroundColor: palette.green,
                      }}
                    />
                    <View
                      style={{
                        flex: paddocks.grass_regular || 0.0001,
                        backgroundColor: palette.yellow,
                      }}
                    />
                    <View
                      style={{
                        flex: paddocks.grass_bad || 0.0001,
                        backgroundColor: palette.red,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs }}>
                      Bueno: {paddocks.grass_good}
                    </Text>
                    <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs }}>
                      Regular: {paddocks.grass_regular}
                    </Text>
                    <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs }}>
                      Malo: {paddocks.grass_bad}
                    </Text>
                  </View>
                </Card>
              </Section>
            </View>
          )}

          {/* Finance summary */}
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <Section title="Finanzas" subtitle="Acumulado del período">
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[
                    {
                      label: 'Ingresos',
                      value: `$${((finance.total_income || 0) / 1_000_000).toFixed(1)}M`,
                      accent: 'green' as AccentKey,
                      icon: 'arrow-up-circle' as const,
                    },
                    {
                      label: 'Gastos',
                      value: `$${((finance.total_expense || 0) / 1_000_000).toFixed(1)}M`,
                      accent: 'red' as AccentKey,
                      icon: 'arrow-down-circle' as const,
                    },
                    {
                      label: 'Ganancia',
                      value: `$${((finance.profit || 0) / 1_000_000).toFixed(1)}M`,
                      accent: 'accent' as AccentKey,
                      icon: 'wallet' as const,
                    },
                  ].map((f) => (
                    <View key={f.label} style={{ alignItems: 'center', flex: 1 }}>
                      <Ionicons name={f.icon} size={22} color={palette[f.accent]} />
                      <Text
                        style={{
                          color: palette.text,
                          fontSize: FONT_SIZE.lg,
                          fontWeight: '700',
                          marginTop: 4,
                        }}
                      >
                        {f.value}
                      </Text>
                      <Text
                        style={{
                          color: palette.textSecondary,
                          fontSize: FONT_SIZE.xs,
                          marginTop: 2,
                        }}
                      >
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Finance Chart */}
                <View style={{ marginTop: SPACING.xl, alignItems: 'center' }}>
                  <BarChart
                    data={{
                      labels: ['Ingresos', 'Gastos'],
                      datasets: [{ data: [finance.total_income || 0, finance.total_expense || 0] }],
                    }}
                    width={screenWidth - SPACING.lg * 2 - SPACING.md * 2}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: palette.surface,
                      backgroundGradientFrom: palette.surface,
                      backgroundGradientTo: palette.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => palette.accent,
                      labelColor: (opacity = 1) => palette.textSecondary,
                      style: { borderRadius: 16 },
                      barPercentage: 0.6,
                    }}
                    style={{ borderRadius: 16, marginTop: SPACING.xs }}
                    showValuesOnTopOfBars
                  />
                </View>
              </Card>
            </Section>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
