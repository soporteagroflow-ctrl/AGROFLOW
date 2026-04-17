import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getAlerts } from '../src/api';
import { AccentKey, FONT_SIZE, RADIUS, SPACING } from '../src/theme';
import { useTheme } from '../src/ThemeContext';
import { Card, EmptyState, MetricCard, Pill, ScreenBackground } from '../src/ui';

const SEVERITY_ACCENT: Record<string, AccentKey> = {
  alta: 'red',
  media: 'orange',
  baja: 'accent',
};

const SEVERITY_LABEL: Record<string, string> = {
  alta: 'Urgente',
  media: 'Media',
  baja: 'Baja',
};

const ALERT_TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  vacunacion_pendiente: { icon: 'medkit', label: 'Vacunación pendiente' },
  parto_proximo: { icon: 'heart', label: 'Parto próximo' },
  potrero_saturado: { icon: 'alert', label: 'Potrero saturado' },
  pasto_deteriorado: { icon: 'leaf', label: 'Pasto deteriorado' },
  revision_pendiente: { icon: 'eye', label: 'Revisión pendiente' },
};

export default function AlertasScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('todas');

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data.alerts || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const filtered =
    filterSeverity === 'todas'
      ? alerts
      : alerts.filter((a) => a.severity === filterSeverity);

  const counts = {
    alta: alerts.filter((a) => a.severity === 'alta').length,
    media: alerts.filter((a) => a.severity === 'media').length,
    baja: alerts.filter((a) => a.severity === 'baja').length,
  };

  const renderAlert = ({ item }: { item: any }) => {
    const sevAccent = SEVERITY_ACCENT[item.severity] || 'accent';
    const sevLabel = SEVERITY_LABEL[item.severity] || item.severity;
    const type = ALERT_TYPE_CONFIG[item.type] || { icon: 'alert', label: item.type };
    const accentSoft = palette[`${sevAccent}Soft` as keyof typeof palette] as string;

    return (
      <Card
        onPress={() => {
          if (item.animal_id) router.push(`/animal/${item.animal_id}`);
          else if (item.paddock_id) router.push(`/potrero/${item.paddock_id}`);
        }}
        style={{
          marginBottom: SPACING.sm,
          borderLeftWidth: 3,
          borderLeftColor: palette[sevAccent],
        }}
        padding={SPACING.md}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: accentSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={type.icon as any} size={20} color={palette[sevAccent]} />
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
                {type.label}
              </Text>
              <Pill label={sevLabel} accent={sevAccent} />
            </View>
            <Text
              style={{
                color: palette.text,
                fontSize: FONT_SIZE.base,
                fontWeight: '700',
                marginTop: 2,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: FONT_SIZE.sm,
                marginTop: 2,
              }}
            >
              {item.description}
            </Text>
            <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs, marginTop: 2 }}>
              {item.date}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={palette.textTertiary} />
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

  const filters: { key: string; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'alta', label: 'Urgentes' },
    { key: 'media', label: 'Media' },
    { key: 'baja', label: 'Baja' },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
          }}
        >
          <Pressable
            testID="alertas-back"
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
              fontSize: FONT_SIZE.xl,
              fontWeight: '800',
              letterSpacing: -0.3,
            }}
          >
            Alertas
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Summary */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: SPACING.lg,
            marginTop: SPACING.md,
          }}
        >
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <MetricCard label="Urgentes" value={counts.alta} accent="red" />
          </View>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <MetricCard label="Media" value={counts.media} accent="orange" />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard label="Baja" value={counts.baja} accent="accent" />
          </View>
        </View>

        {/* Filter chips */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: SPACING.lg,
            marginTop: SPACING.md,
          }}
        >
          {filters.map((f) => {
            const active = filterSeverity === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`alertas-filter-${f.key}`}
                onPress={() => setFilterSeverity(f.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
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
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.alert_id || `alert_${i}`}
          renderItem={renderAlert}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.sm,
            paddingBottom: 60,
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
              icon={<Ionicons name="checkmark-circle" size={32} color={palette.green} />}
              title="¡Todo en orden!"
              subtitle="No hay alertas pendientes."
            />
          }
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}
