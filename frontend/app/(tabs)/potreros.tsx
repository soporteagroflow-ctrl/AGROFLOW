import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getPaddocks, getNDVIData } from '../../src/api';
import { cacheData, getCachedData, isOnline, CACHE_KEYS } from '../../src/offline';
import { COLORS, SPACING, FONT_SIZE, GRASS_STATUS, PADDOCK_STATUS } from '../../src/theme';

type ViewMode = 'list' | 'map' | 'ndvi';

export default function PotrerosScreen() {
  const router = useRouter();
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
      } catch (e) {
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

  useEffect(() => { fetchPaddocks(); }, [fetchPaddocks]);
  const onRefresh = () => { setRefreshing(true); fetchPaddocks(); };

  // Regular map HTML
  const mapHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100vh}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map').setView([4.609,-74.082],14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
var ps=${JSON.stringify(paddocks.map(p=>({n:p.name,lat:p.center_lat,lng:p.center_lng,s:p.status,g:p.grass_status,a:p.animal_count,h:p.area_hectares})))};
var colors={activo:'#4CAF50',en_descanso:'#FFA726',mantenimiento:'#42A5F5'};
ps.forEach(function(p){if(p.lat&&p.lng){var c=colors[p.s]||'#4CAF50';
L.circleMarker([p.lat,p.lng],{radius:20,color:c,fillColor:c,fillOpacity:0.3,weight:2}).addTo(map)
.bindPopup('<b>'+p.n+'</b><br>'+p.h+' ha<br>Animales: '+p.a+'<br>Pasto: '+p.g);}});
if(ps.length>0&&ps[0].lat)map.setView([ps[0].lat,ps[0].lng],14);
</script></body></html>`;

  // NDVI Satellite map HTML
  const ndviHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100vh}.legend{position:absolute;bottom:20px;right:10px;background:rgba(0,0,0,0.8);padding:10px;border-radius:8px;z-index:1000;color:#fff;font:12px sans-serif}.legend-item{display:flex;align-items:center;gap:6px;margin:4px 0}.legend-dot{width:14px;height:14px;border-radius:7px}</style>
</head><body><div id="map"></div>
<div class="legend">
<b>Índice NDVI</b>
<div class="legend-item"><div class="legend-dot" style="background:#2E7D32"></div>Óptimo (>0.6)</div>
<div class="legend-item"><div class="legend-dot" style="background:#FFA726"></div>Moderado (0.3-0.6)</div>
<div class="legend-item"><div class="legend-dot" style="background:#CF6679"></div>Crítico (<0.3)</div>
</div>
<script>
var map=L.map('map').setView([4.609,-74.082],14);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri Satellite',maxZoom:19}).addTo(map);
var ps=${JSON.stringify(ndviData.map(p=>({n:p.name,lat:p.center_lat,lng:p.center_lng,ndvi:p.ndvi_value,g:p.grass_status,a:p.animal_count,h:p.area_hectares,cap:p.capacity,u:p.usage_percent,rec:p.recommendation})))};
function ndviColor(v){if(v>=0.6)return '#2E7D32';if(v>=0.3)return '#FFA726';return '#CF6679';}
ps.forEach(function(p){if(p.lat&&p.lng){var c=ndviColor(p.ndvi);
L.circle([p.lat,p.lng],{radius:150,color:c,fillColor:c,fillOpacity:0.4,weight:2}).addTo(map)
.bindPopup('<b>'+p.n+'</b><br>NDVI: <b>'+p.ndvi.toFixed(2)+'</b><br>Área: '+p.h+' ha<br>Pasto: '+p.g+'<br>Animales: '+p.a+'/'+p.cap+' ('+p.u+'%)<br><i>'+p.rec+'</i>');}});
if(ps.length>0&&ps[0].lat)map.setView([ps[0].lat,ps[0].lng],14);
</script></body></html>`;

  const renderPaddock = ({ item }: { item: any }) => {
    const grass = GRASS_STATUS[item.grass_status] || GRASS_STATUS.bueno;
    const pStatus = PADDOCK_STATUS[item.status] || PADDOCK_STATUS.activo;
    return (
      <TouchableOpacity testID={`paddock-item-${item.paddock_id}`} style={styles.paddockCard} onPress={() => router.push(`/potrero/${item.paddock_id}`)} activeOpacity={0.7}>
        <View style={styles.paddockHeader}>
          <View style={[styles.paddockIcon, { backgroundColor: pStatus.color + '20' }]}>
            <Ionicons name="leaf" size={24} color={pStatus.color} />
          </View>
          <View style={styles.paddockInfo}>
            <Text style={styles.paddockName}>{item.name}</Text>
            <Text style={styles.paddockArea}>{item.area_hectares} ha · {item.grass_type || 'Sin tipo'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </View>
        <View style={styles.paddockStats}>
          <View style={styles.paddockStat}>
            <Ionicons name="paw" size={16} color={COLORS.primary} />
            <Text style={styles.paddockStatText}>{item.animal_count} animales</Text>
          </View>
          <View style={[styles.paddockBadge, { backgroundColor: grass.color + '20' }]}>
            <View style={[styles.dot, { backgroundColor: grass.color }]} />
            <Text style={[styles.paddockBadgeText, { color: grass.color }]}>Pasto: {grass.label}</Text>
          </View>
          <View style={[styles.paddockBadge, { backgroundColor: pStatus.color + '20' }]}>
            <Text style={[styles.paddockBadgeText, { color: pStatus.color }]}>{pStatus.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      {offline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color={COLORS.white} />
          <Text style={styles.offlineText}>Sin conexión</Text>
        </View>
      )}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Potreros</Text>
          <Text style={styles.subtitle}>{paddocks.length} registrados</Text>
        </View>
        <View style={styles.viewToggle}>
          {(['list', 'map', 'ndvi'] as ViewMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              testID={`potreros-view-${mode}`}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleActive]}
              onPress={() => setViewMode(mode)}
            >
              <Ionicons
                name={mode === 'list' ? 'list' : mode === 'map' ? 'map' : 'satellite'}
                size={18}
                color={viewMode === mode ? COLORS.white : COLORS.muted}
              />
              {mode === 'ndvi' && <Text style={[styles.toggleText, viewMode === mode && { color: COLORS.white }]}>NDVI</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={paddocks}
          keyExtractor={item => item.paddock_id}
          renderItem={renderPaddock}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>No hay potreros registrados</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          {viewMode === 'ndvi' && (
            <View style={styles.ndviBanner}>
              <Ionicons name="satellite" size={14} color={COLORS.white} />
              <Text style={styles.ndviBannerText}>Vista Satelital NDVI - Salud del Pasto</Text>
            </View>
          )}
          {Platform.OS === 'web' ? (
            <iframe srcDoc={viewMode === 'ndvi' ? ndviHtml : mapHtml} style={{ width: '100%', height: '100%', border: 'none' } as any} />
          ) : (
            <WebView source={{ html: viewMode === 'ndvi' ? ndviHtml : mapHtml }} style={styles.map} javaScriptEnabled />
          )}
        </View>
      )}

      {/* NDVI Summary Cards */}
      {viewMode === 'ndvi' && ndviData.length > 0 && (
        <View style={styles.ndviSummary}>
          {ndviData.map(p => (
            <View key={p.paddock_id} style={[styles.ndviCard, { borderLeftColor: p.ndvi_value >= 0.6 ? '#2E7D32' : p.ndvi_value >= 0.3 ? '#FFA726' : '#CF6679' }]}>
              <Text style={styles.ndviName}>{p.name}</Text>
              <Text style={[styles.ndviValue, { color: p.ndvi_value >= 0.6 ? '#4CAF50' : p.ndvi_value >= 0.3 ? '#FFA726' : '#CF6679' }]}>
                NDVI: {p.ndvi_value.toFixed(2)}
              </Text>
              <Text style={styles.ndviRec}>{p.recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity testID="potreros-add-btn" style={styles.fab} onPress={() => router.push('/potrero/nuevo')} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D84315', paddingVertical: 6 },
  offlineText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  viewToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.muted },
  mapContainer: { flex: 1, margin: SPACING.lg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  map: { flex: 1 },
  ndviBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1565C0', paddingVertical: 6 },
  ndviBannerText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '600' },
  ndviSummary: { position: 'absolute', bottom: 90, left: SPACING.lg, right: SPACING.lg + 64, maxHeight: 160 },
  ndviCard: { backgroundColor: COLORS.surface + 'F0', borderRadius: 8, padding: SPACING.sm, marginBottom: 4, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  ndviName: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.text },
  ndviValue: { fontSize: FONT_SIZE.xs, fontWeight: '800' },
  ndviRec: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 100 },
  paddockCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  paddockHeader: { flexDirection: 'row', alignItems: 'center' },
  paddockIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  paddockInfo: { flex: 1, marginLeft: SPACING.md },
  paddockName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  paddockArea: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  paddockStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm, gap: SPACING.sm },
  paddockStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paddockStatText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  paddockBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  paddockBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.base, color: COLORS.muted },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
