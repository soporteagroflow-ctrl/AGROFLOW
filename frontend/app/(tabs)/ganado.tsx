import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAnimals } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE, ANIMAL_TYPES, ANIMAL_STATUS } from '../../src/theme';

export default function GanadoScreen() {
  const router = useRouter();
  const [animals, setAnimals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('todos');

  const fetchAnimals = useCallback(async () => {
    try {
      const res = await getAnimals();
      setAnimals(res.data);
      applyFilter(res.data, search, filterType);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  const applyFilter = (data: any[], searchText: string, type: string) => {
    let result = data;
    if (type !== 'todos') {
      result = result.filter(a => a.animal_type === type);
    }
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(s) ||
        a.tag_id?.toLowerCase().includes(s) ||
        a.breed?.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  };

  useEffect(() => { applyFilter(animals, search, filterType); }, [search, filterType]);

  const onRefresh = () => { setRefreshing(true); fetchAnimals(); };

  const typeFilters = [
    { key: 'todos', label: 'Todos' },
    { key: 'vaca', label: 'Vacas' },
    { key: 'toro', label: 'Toros' },
    { key: 'ternero', label: 'Terneros' },
    { key: 'novilla', label: 'Novillas' },
  ];

  const getAnimalIcon = (type: string) => {
    switch (type) {
      case 'toro': return 'male';
      case 'vaca': return 'female';
      case 'ternero': return 'happy';
      default: return 'paw';
    }
  };

  const renderAnimal = ({ item }: { item: any }) => {
    const status = ANIMAL_STATUS[item.status] || ANIMAL_STATUS.activo;
    return (
      <TouchableOpacity
        testID={`animal-item-${item.animal_id}`}
        style={styles.animalCard}
        onPress={() => router.push(`/animal/${item.animal_id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.animalAvatar, { backgroundColor: status.color + '20' }]}>
          <Ionicons name={getAnimalIcon(item.animal_type)} size={24} color={status.color} />
        </View>
        <View style={styles.animalInfo}>
          <View style={styles.animalNameRow}>
            <Text style={styles.animalName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.animalDetails}>
            {item.tag_id ? `#${item.tag_id} · ` : ''}{ANIMAL_TYPES[item.animal_type] || item.animal_type} · {item.breed || 'Sin raza'}
          </Text>
          {item.weight > 0 && <Text style={styles.animalWeight}>{item.weight} kg</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ganado</Text>
        <Text style={styles.subtitle}>{animals.length} animales registrados</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.muted} />
        <TextInput
          testID="ganado-search-input"
          style={styles.searchInput}
          placeholder="Buscar por nombre, arete o raza..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type Filters */}
      <View style={styles.filterRow}>
        {typeFilters.map(f => (
          <TouchableOpacity
            key={f.key}
            testID={`ganado-filter-${f.key}`}
            style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
            onPress={() => setFilterType(f.key)}
          >
            <Text style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.animal_id}
        renderItem={renderAnimal}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No se encontraron animales</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        testID="ganado-add-btn"
        style={styles.fab}
        onPress={() => router.push('/animal/nuevo')}
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
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: 12, paddingHorizontal: SPACING.md, height: 48, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: FONT_SIZE.base, color: COLORS.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.sm, gap: SPACING.sm },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 100 },
  animalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  animalAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  animalInfo: { flex: 1, marginLeft: SPACING.md },
  animalNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  animalName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  animalDetails: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  animalWeight: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.base, color: COLORS.muted },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
