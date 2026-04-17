import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { getPaddocks, getNDVIData } from '../../src/api';
import { cacheData, getCachedData, isOnline, CACHE_KEYS } from '../../src/offline';
import {
  GRASS_STATUS_LABEL,
  PADDOCK_STATUS_LABEL,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import {
  Card,
  EmptyState,
  Pill,
  ScreenBackground,
} from '../../src/ui';

type ViewMode = 'list' | 'map' | 'ndvi';

export default function PotrerosScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [paddocks, setPaddocks] = useState<any[]>([]);
  const [ndviData, setNdviData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [offline, setOffline] = useState(false);

  const fetchPaddocks = useCallback(async () => {
    const online = await isOnline();
    setOffline(!online);
    if (online) {
      try {
        const [pRes, nRes] = await Promise.all([getPaddocks(), getNDVIData()]);
        setPaddocks(pRes.data);
        setNdviData(nRes.data.paddocks || []);
        cacheData(CACHE_KEYS.paddocks, pRes.data);
        cacheData(CACHE_KEYS.ndvi, nRes.data.paddocks);
      } catch {
        const cached = await getCachedData(CACHE_KEYS.paddocks);
        const cachedNdvi = await getCachedData(CACHE_KEYS.ndvi);
        if (cached) setPaddocks(cached);
        if (cachedNdvi) setNdviData(cachedNdvi);
      }
    } else {
      const cached = await getCachedData(CACHE_KEYS.paddocks);
      const cachedNdvi = await getCachedData(CACHE_KEYS.ndvi);
      if (cached) setPaddocks(cached);
      if (cachedNdvi) setNdviData(cachedNdvi);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPaddocks();
  }, [fetchPaddocks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaddocks();
  };

  const mapHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;background:${palette.background}}#map{width:100%;height:100vh}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map').setView([4.609,-74.082],14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
var ps=${JSON.stringify(
    paddocks.map((p) => ({
      n: p.name,
      lat: p.center_lat,
      lng: p.center_lng,
      s: p.status,
      g: p.grass_status,
      a: p.animal_count,
      h: p.area_hectares,
    }))
  )};
var colors={activo:'${palette.green}',en_descanso:'${palette.orange}',mantenimiento:'${palette.accent}'};
ps.forEach(function(p){if(p.lat&&p.lng){var c=colors[p.s]||'${palette.accent}';
L.circleMarker([p.lat,p.lng],{radius:20,color:c,fillColor:c,fillOpacity:0.3,weight:2}).addTo(map)
.bindPopup('<b>'+p.n+'</b><br>'+p.h+' ha<br>Animales: '+p.a+'<br>Pasto: '+p.g);}});
if(ps.length>0&&ps[0].lat)map.setView([ps[0].lat,ps[0].lng],14);
</script></body></html>`;

  const ndviHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;background:${palette.background}}#map{width:100%;height:100vh}.legend{position:absolute;bottom:20px;right:10px;background:rgba(11,15,26,0.9);padding:10px;border-radius:12px;z-index:1000;color:#fff;font:12px sans-serif}.legend-item{display:flex;align-items:center;gap:6px;margin:4px 0}.legend-dot{width:12px;height:12px;border-radius:6px}</style>
</head><body><div id="map"></div>
<div class="legend">
<b>Índice NDVI</b>
<div class="legend-item"><div class="legend-dot" style="background:${palette.green}"></div>Óptimo (>0.6)</div>
<div class="legend-item"><div class="legend-dot" style="background:${palette.orange}"></div>Moderado (0.3-0.6)</div>
<div class="legend-item"><div class="legend-dot" style="background:${palette.red}"></div>Crítico (<0.3)</div>
</div>
<script>
var map=L.map('map').setView([4.609,-74.082],14);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri Satellite',maxZoom:19}).addTo(map);
var ps=${JSON.stringify(
    ndviData.map((p) => ({
      n: p.name,
      lat: p.center_lat,
      lng: p.center_lng,
      ndvi: p.ndvi_value,
      g: p.grass_status,
      a: p.animal_count,
      h: p.area_hectares,
      cap: p.capacity,
      u: p.usage_percent,
      rec: p.recommendation,
    }))
  )};
function ndviColor(v){if(v>=0.6)return '${palette.green}';if(v>=0.3)return '${palette.orange}';return '${palette.red}';}
ps.forEach(function(p){if(p.lat&&p.lng){var c=ndviColor(p.ndvi);
L.circle([p.lat,p.lng],{radius:150,color:c,fillColor:c,fillOpacity:0.4,weight:2}).addTo(map)
.bindPopup('<b>'+p.n+'</b><br>NDVI: <b>'+p.ndvi.toFixed(2)+'</b><br>Área: '+p.h+' ha<br>Pasto: '+p.g+'<br>Animales: '+p.a+'/'+p.cap+' ('+p.u+'%)<br><i>'+p.rec+'</i>');}});
if(ps.length>0&&ps[0].lat)map.setView([ps[0].lat,ps[0].lng],14);
</script></body></html>`;

  const renderPaddock = ({ item }: { item: any }) => {
    const grassMeta = GRASS_STATUS_LABEL[item.grass_status] || GRASS_STATUS_LABEL.bueno;
    const statusMeta = PADDOCK_STATUS_LABEL[item.status] || PADDOCK_STATUS_LABEL.activo;
    const accentBg = palette[`${statusMeta.accent}Soft` as keyof typeof palette] as string;
    return (
      <Card
        onPress={() => router.push(`/potrero/${item.paddock_id}`)}
        style={{ marginBottom: SPACING.sm }}
        padding={SPACING.md}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: accentBg,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="leaf" size={20} color={palette[statusMeta.accent]} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={{ color: palette.text, fontSize: FONT_SIZE.base, fontWeight: '700' }}>
              {item.name}
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 }}>
              {item.area_hectares} ha · {item.grass_type || 'Sin tipo'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md }}>
          <Pill
            label={`${item.animal_count ?? 0} animales`}
            accent="accent"
            style={{ marginRight: 6, marginBottom: 6 }}
          />
          <Pill
            label={`Pasto · ${grassMeta.label}`}
            accent={grassMeta.accent}
            style={{ marginRight: 6, marginBottom: 6 }}
          />
          <Pill
            label={statusMeta.label}
            accent={statusMeta.accent}
            style={{ marginRight: 6, marginBottom: 6 }}
          />
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

  const viewChips: { key: ViewMode; icon: any; label: string }[] = [
    { key: 'list', icon: 'list', label: 'Lista' },
    { key: 'map', icon: 'map', label: 'Mapa' },
    { key: 'ndvi', icon: 'globe', label: 'NDVI' },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {offline && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              backgroundColor: palette.orangeSoft,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
            }}
          >
            <Ionicons name="cloud-offline" size={14} color={palette.orange} />
            <Text
              style={{
                marginLeft: 6,
                color: palette.orange,
                fontSize: FONT_SIZE.xs,
                fontWeight: '600',
              }}
            >
              Sin conexión
            </Text>
          </View>
        )}

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
                Potreros
              </Text>
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  marginTop: 2,
                }}
              >
                {paddocks.length} registrados
              </Text>
            </View>
            <Pressable
              testID="potreros-add-btn"
              onPress={() => router.push('/potrero/nuevo')}
              style={({ pressed }) => ({
                height: 40,
                paddingHorizontal: 16,
                borderRadius: RADIUS.pill,
                backgroundColor: palette.btnPrimaryBg,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="add" size={16} color={palette.btnPrimaryFg} />
              <Text
                style={{
                  color: palette.btnPrimaryFg,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '700',
                  marginLeft: 4,
                }}
              >
                Nuevo
              </Text>
            </Pressable>
          </View>

          {/* Segmented view toggle */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: SPACING.md,
              backgroundColor: palette.surface,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 4,
              alignSelf: 'flex-start',
            }}
          >
            {viewChips.map((v) => {
              const active = viewMode === v.key;
              return (
                <Pressable
                  key={v.key}
                  testID={`potreros-view-${v.key}`}
                  onPress={() => setViewMode(v.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: RADIUS.pill,
                    backgroundColor: active ? palette.text : 'transparent',
                  }}
                >
                  <Ionicons
                    name={v.icon}
                    size={14}
                    color={active ? palette.background : palette.textSecondary}
                  />
                  <Text
                    style={{
                      color: active ? palette.background : palette.textSecondary,
                      fontSize: FONT_SIZE.xs,
                      fontWeight: '700',
                      marginLeft: 4,
                      letterSpacing: 0.2,
                    }}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {viewMode === 'list' ? (
          <FlatList
            data={paddocks}
            keyExtractor={(item) => item.paddock_id}
            renderItem={renderPaddock}
            contentContainerStyle={{
              paddingHorizontal: SPACING.lg,
              paddingTop: SPACING.md,
              paddingBottom: 120,
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
                icon={<Ionicons name="map-outline" size={28} color={palette.textTertiary} />}
                title="Sin potreros"
                subtitle="Comienza agregando un potrero a tu finca."
              />
            }
          />
        ) : (
          <View
            style={{
              flex: 1,
              margin: SPACING.lg,
              borderRadius: RADIUS.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            {viewMode === 'ndvi' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  backgroundColor: palette.accentSoft,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.border,
                }}
              >
                <Ionicons name="globe" size={14} color={palette.accent} />
                <Text
                  style={{
                    marginLeft: 6,
                    color: palette.accent,
                    fontSize: FONT_SIZE.xs,
                    fontWeight: '700',
                  }}
                >
                  Vista satelital · NDVI
                </Text>
              </View>
            )}
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={viewMode === 'ndvi' ? ndviHtml : mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' } as any}
              />
            ) : (
              <WebView
                source={{ html: viewMode === 'ndvi' ? ndviHtml : mapHtml }}
                style={{ flex: 1 }}
                javaScriptEnabled
              />
            )}
          </View>
        )}

        {/* NDVI summary floating cards */}
        {viewMode === 'ndvi' && ndviData.length > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 24,
              left: SPACING.lg,
              right: SPACING.lg,
              maxHeight: 140,
            }}
          >
            {ndviData.slice(0, 3).map((p) => {
              const accent =
                p.ndvi_value >= 0.6 ? 'green' : p.ndvi_value >= 0.3 ? 'orange' : 'red';
              return (
                <View
                  key={p.paddock_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    borderWidth: 1,
                    borderLeftWidth: 3,
                    borderLeftColor: palette[accent as 'green'],
                    borderRadius: RADIUS.md,
                    padding: SPACING.sm,
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: FONT_SIZE.xs, fontWeight: '700' }}>
                      {p.name}
                    </Text>
                    <Text
                      style={{
                        color: palette.textSecondary,
                        fontSize: 10,
                        marginTop: 1,
                      }}
                    >
                      {p.recommendation}
                    </Text>
                  </View>
                  <Pill label={`NDVI ${p.ndvi_value.toFixed(2)}`} accent={accent as 'green'} />
                </View>
              );
            })}
          </View>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}
