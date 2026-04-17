import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { getPaddock, deletePaddock } from '../../src/api';
import {
  AccentKey,
  FONT_SIZE,
  GRASS_STATUS_LABEL,
  PADDOCK_STATUS_LABEL,
  RADIUS,
  SPACING,
} from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { Card, MetricCard, Pill, ScreenBackground, Section } from '../../src/ui';

const GRASS_ACCENT: Record<string, AccentKey> = {
  bueno: 'green',
  regular: 'orange',
  malo: 'red',
};

const STATUS_ACCENT: Record<string, AccentKey> = {
  activo: 'green',
  en_descanso: 'orange',
  mantenimiento: 'accent',
};

export default function PaddockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const [paddock, setPaddock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaddock(id!)
      .then((r) => setPaddock(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await deletePaddock(id!);
      router.back();
    } catch {
      /* ignore */
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

  if (!paddock) {
    return (
      <ScreenBackground>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.base }}>
            Potrero no encontrado
          </Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const grassAccent: AccentKey = GRASS_ACCENT[paddock.grass_status] || 'green';
  const statusAccent: AccentKey = STATUS_ACCENT[paddock.status] || 'green';
  const grassLabel =
    GRASS_STATUS_LABEL[paddock.grass_status]?.label || paddock.grass_status || '';
  const statusLabel =
    PADDOCK_STATUS_LABEL[paddock.status]?.label || paddock.status || '';

  const mapHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;background:${palette.background}}#map{width:100%;height:100%}</style>
</head><body><div id="map" style="height:100%"></div>
<script>
var lat=${paddock.center_lat || 4.609}, lng=${paddock.center_lng || -74.082};
var map=L.map('map',{zoomControl:false}).setView([lat,lng],15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
L.circleMarker([lat,lng],{radius:30,color:'${palette[statusAccent]}',fillColor:'${palette[statusAccent]}',fillOpacity:0.25,weight:2}).addTo(map).bindPopup('<b>${paddock.name}</b>');
L.marker([lat,lng]).addTo(map);
</script></body></html>`;

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
            testID="potrero-detail-back"
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
            {paddock.name}
          </Text>
          <Pressable
            testID="potrero-detail-delete"
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
          {/* Map card */}
          <Card padding={0} style={{ marginTop: SPACING.md, overflow: 'hidden' }}>
            <View style={{ height: 240 }}>
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={mapHtml}
                  style={{ width: '100%', height: 240, border: 'none' } as any}
                />
              ) : (
                <WebView source={{ html: mapHtml }} style={{ flex: 1 }} javaScriptEnabled />
              )}
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                padding: SPACING.md,
                borderTopWidth: 1,
                borderTopColor: palette.border,
              }}
            >
              <View style={{ marginRight: 8, marginBottom: 4 }}>
                <Pill label={statusLabel} accent={statusAccent} />
              </View>
              <View style={{ marginRight: 8, marginBottom: 4 }}>
                <Pill label={`Pasto · ${grassLabel}`} accent={grassAccent} />
              </View>
            </View>
          </Card>

          {/* Metrics */}
          <View style={{ flexDirection: 'row', marginTop: SPACING.md }}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <MetricCard
                label="Área"
                value={`${paddock.area_hectares || 0} ha`}
                accent="accent"
                icon={<Ionicons name="resize" size={16} color={palette.accent} />}
              />
            </View>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <MetricCard
                label="Animales"
                value={paddock.animal_count || 0}
                accent="purple"
                icon={<Ionicons name="paw" size={16} color={palette.purple} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard
                label="Capacidad"
                value={paddock.capacity || 0}
                accent="teal"
                icon={<Ionicons name="people" size={16} color={palette.teal} />}
              />
            </View>
          </View>

          {/* Info */}
          <Card padding={SPACING.md} style={{ marginTop: SPACING.md }}>
            {[
              ['Tipo de pasto', paddock.grass_type || 'Sin especificar'],
              [
                'Coordenadas',
                `${(paddock.center_lat ?? 0).toFixed(4)}, ${(paddock.center_lng ?? 0).toFixed(4)}`,
              ],
              ...(paddock.notes ? [['Notas', paddock.notes]] : []),
            ].map(([label, value], i, arr) => (
              <View key={label as string}>
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

          {/* Animals */}
          {paddock.animals && paddock.animals.length > 0 && (
            <View style={{ marginTop: SPACING.lg }}>
              <Section
                title="Animales en este potrero"
                subtitle={`${paddock.animals.length} registros`}
              >
                {paddock.animals.map((a: any) => (
                  <Card
                    key={a.animal_id}
                    onPress={() => router.push(`/animal/${a.animal_id}`)}
                    padding={SPACING.md}
                    style={{ marginBottom: SPACING.sm }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: palette.accentSoft,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name={a.sex === 'macho' ? 'male' : 'female'}
                          size={16}
                          color={palette.accent}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: SPACING.md }}>
                        <Text
                          style={{
                            color: palette.text,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: '700',
                          }}
                        >
                          {a.name}
                        </Text>
                        <Text
                          style={{
                            color: palette.textSecondary,
                            fontSize: FONT_SIZE.xs,
                            marginTop: 1,
                          }}
                        >
                          #{a.tag_id || '-'} · {a.animal_type} · {a.weight || 0} kg
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={palette.textTertiary} />
                    </View>
                  </Card>
                ))}
              </Section>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
