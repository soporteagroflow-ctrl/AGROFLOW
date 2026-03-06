import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getPaddocks } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE, GRASS_STATUS, PADDOCK_STATUS } from '../../src/theme';

export default function PotrerosScreen() {
  const router = useRouter();
  const [paddocks, setPaddocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');

  const fetchPaddocks = useCallback(async () => {
    try {
      const res = await getPaddocks();
      setPaddocks(res.data);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPaddocks(); }, [fetchPaddocks]);
  const onRefresh = () => { setRefreshing(true); fetchPaddocks(); };

  const mapHtml = `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100vh}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([4.609, -74.082], 14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
var paddocks = ${JSON.stringify(paddocks.map(p => ({
  name: p.name,
  lat: p.center_lat,
  lng: p.center_lng,
  status: p.status,
  grass: p.grass_status,
  animals: p.animal_count,
  area: p.area_hectares,
  id: p.paddock_id
})))};
var colors = {activo:'#4CAF50', en_descanso:'#FFA726', mantenimiento:'#42A5F5'};
paddocks.forEach(function(p){
  if(p.lat && p.lng){
    var c = colors[p.status] || '#4CAF50';
    L.circleMarker([p.lat, p.lng], {radius:20, color:c, fillColor:c, fillOpacity:0.3, weight:2})
      .addTo(map)
      .bindPopup('<b>'+p.name+'</b><br>'+p.area+' ha<br>Animales: '+p.animals+'<br>Pasto: '+p.grass);
  }
});
if(paddocks.length > 0 && paddocks[0].lat) {
  map.setView([paddocks[0].lat, paddocks[0].lng], 14);
}
</script></body></html>`;

  const renderPaddock = ({ item }: { item: any }) => {
    const grass = GRASS_STATUS[item.grass_status] || GRASS_STATUS.bueno;
    const pStatus = PADDOCK_STATUS[item.status] || PADDOCK_STATUS.activo;
    return (
      <TouchableOpacity
        testID={`paddock-item-${item.paddock_id}`}
        style={styles.paddockCard}
        onPress={() => router.push(`/potrero/${item.paddock_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.paddockHeader}>
          <View style={[styles.paddockIcon, { backgroundColor: pStatus.color + '20' }]}>
            <Ionicons name="leaf" size={24} color={pStatus.color} />
          </View>
          <View style={styles.paddockInfo}>
            <Text style={styles.paddockName}>{item.name}</Text>
            <Text style={styles.paddockArea}>{item.area_hectares} hectáreas · {item.grass_type || 'Sin tipo'}</Text>
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

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Potreros</Text>
          <Text style={styles.subtitle}>{paddocks.length} potreros registrados</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            testID="potreros-view-list"
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? COLORS.white : COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="potreros-view-map"
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? COLORS.white : COLORS.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' } as any}
            />
          ) : (
            <WebView
              source={{ html: mapHtml }}
              style={styles.map}
              javaScriptEnabled
            />
          )}
        </View>
      ) : (
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
      )}

      <TouchableOpacity
        testID="potreros-add-btn"
        style={styles.fab}
        onPress={() => router.push('/potrero/nuevo')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  viewToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 },
  toggleActive: { backgroundColor: COLORS.primary },
  mapContainer: { flex: 1, margin: SPACING.lg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  map: { flex: 1 },
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
