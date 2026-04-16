import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getPaddock, deletePaddock } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE, GRASS_STATUS, PADDOCK_STATUS, ANIMAL_TYPES } from '../../src/theme';

export default function PaddockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [paddock, setPaddock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaddock(id!).then(r => setPaddock(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try { await deletePaddock(id!); router.back(); } catch (e) { console.log('Error:', e); }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  if (!paddock) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>Potrero no encontrado</Text></View></SafeAreaView>;

  const grass = GRASS_STATUS[paddock.grass_status] || GRASS_STATUS.bueno;
  const pStatus = PADDOCK_STATUS[paddock.status] || PADDOCK_STATUS.activo;

  const mapHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100%}</style>
</head><body><div id="map" style="height:300px"></div>
<script>
var lat=${paddock.center_lat || 4.609}, lng=${paddock.center_lng || -74.082};
var map=L.map('map').setView([lat,lng],15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
L.circleMarker([lat,lng],{radius:30,color:'${pStatus.color}',fillColor:'${pStatus.color}',fillOpacity:0.2,weight:2}).addTo(map).bindPopup('<b>${paddock.name}</b>');
L.marker([lat,lng]).addTo(map);
</script></body></html>`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="potrero-detail-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{paddock.name}</Text>
        <TouchableOpacity testID="potrero-detail-delete" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#CF6679" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe srcDoc={mapHtml} style={{ width: '100%', height: 250, border: 'none' } as any} />
          ) : (
            <WebView source={{ html: mapHtml }} style={{ height: 250 }} javaScriptEnabled />
          )}
        </View>

        {/* Status Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: pStatus.color + '20' }]}>
            <Ionicons name="flag" size={14} color={pStatus.color} />
            <Text style={[styles.badgeText, { color: pStatus.color }]}>{pStatus.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: grass.color + '20' }]}>
            <Ionicons name="leaf" size={14} color={grass.color} />
            <Text style={[styles.badgeText, { color: grass.color }]}>Pasto: {grass.label}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="resize" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{paddock.area_hectares} ha</Text>
            <Text style={styles.statLabel}>Área</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="paw" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{paddock.animal_count || 0}</Text>
            <Text style={styles.statLabel}>Animales</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#42A5F5" />
            <Text style={styles.statValue}>{paddock.capacity || 0}</Text>
            <Text style={styles.statLabel}>Capacidad</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de pasto</Text>
            <Text style={styles.infoValue}>{paddock.grass_type || 'Sin especificar'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coordenadas</Text>
            <Text style={styles.infoValue}>{paddock.center_lat?.toFixed(4)}, {paddock.center_lng?.toFixed(4)}</Text>
          </View>
          {paddock.notes ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notas</Text>
              <Text style={styles.infoValue}>{paddock.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Animals in this paddock */}
        {paddock.animals && paddock.animals.length > 0 && (
          <View style={styles.animalsSection}>
            <Text style={styles.sectionTitle}>Animales en este potrero</Text>
            {paddock.animals.map((a: any) => (
              <TouchableOpacity
                key={a.animal_id}
                testID={`potrero-animal-${a.animal_id}`}
                style={styles.animalRow}
                onPress={() => router.push(`/animal/${a.animal_id}`)}
              >
                <View style={styles.animalIcon}>
                  <Ionicons name={a.sex === 'macho' ? 'male' : 'female'} size={16} color={COLORS.primary} />
                </View>
                <View style={styles.animalInfo}>
                  <Text style={styles.animalName}>{a.name}</Text>
                  <Text style={styles.animalMeta}>#{a.tag_id} · {ANIMAL_TYPES[a.animal_type] || a.animal_type} · {a.weight || 0}kg</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FONT_SIZE.base, color: COLORS.muted },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  mapContainer: { marginHorizontal: SPACING.lg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, height: 250 },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  infoSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  animalsSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  animalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  animalIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  animalInfo: { flex: 1, marginLeft: SPACING.sm },
  animalName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  animalMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
});
