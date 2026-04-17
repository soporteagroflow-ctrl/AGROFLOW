import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getAnimals } from '../../src/api';
import { useToastStore } from '../../src/store';
import {
  ANIMAL_STATUS_LABEL,
  ANIMAL_TYPE_ACCENT,
  ANIMAL_TYPES,
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
  Section,
  StatDot,
} from '../../src/ui';

const TYPE_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vaca', label: 'Vacas' },
  { key: 'toro', label: 'Toros' },
  { key: 'ternero', label: 'Terneros' },
  { key: 'novilla', label: 'Novillas' },
];

function animalIcon(type: string) {
  switch (type) {
    case 'toro':
      return 'male';
    case 'vaca':
      return 'female';
    case 'ternero':
      return 'happy';
    default:
      return 'paw';
  }
}

export default function GanadoScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('todos');

  const toast = useToastStore();

  const fetchAnimals = useCallback(async () => {
    try {
      const res = await getAnimals();
      setAnimals(res.data);
    } catch {
      toast.show('Error al cargar los animales', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const filtered = useMemo(() => {
    let result = animals;
    if (filterType !== 'todos') {
      result = result.filter((a) => a.animal_type === filterType);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(s) ||
          a.tag_id?.toLowerCase().includes(s) ||
          a.breed?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [animals, search, filterType]);

  const renderAnimal = ({ item }: { item: any }) => {
    const statusMeta = ANIMAL_STATUS_LABEL[item.status] || ANIMAL_STATUS_LABEL.activo;
    const typeAccent = ANIMAL_TYPE_ACCENT[item.animal_type] || 'accent';
    const iconColor = palette[typeAccent];
    const iconBg = palette[`${typeAccent}Soft` as keyof typeof palette] as string;

    return (
      <Card
        onPress={() => router.push(`/animal/${item.animal_id}`)}
        style={{ marginBottom: SPACING.sm }}
        padding={SPACING.md}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: iconBg,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={animalIcon(item.animal_type) as any} size={20} color={iconColor} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: palette.text, fontSize: FONT_SIZE.base, fontWeight: '700' }}>
                {item.name}
              </Text>
              <Pill label={statusMeta.label} accent={statusMeta.accent} />
            </View>
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: FONT_SIZE.sm,
                marginTop: 2,
              }}
            >
              {item.tag_id ? `#${item.tag_id} · ` : ''}
              {ANIMAL_TYPES[item.animal_type] || item.animal_type} · {item.breed || 'Sin raza'}
            </Text>
            {item.weight > 0 && (
              <Text
                style={{
                  color: palette.accent,
                  fontSize: FONT_SIZE.xs,
                  fontWeight: '700',
                  marginTop: 2,
                }}
              >
                {item.weight} kg
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
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

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}
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
                Ganado
              </Text>
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  marginTop: 2,
                }}
              >
                {animals.length} animales registrados
              </Text>
            </View>
            <Pressable
              testID="ganado-add-btn"
              onPress={() => router.push('/animal/nuevo')}
              style={({ pressed }) => ({
                height: 40,
                paddingHorizontal: 16,
                borderRadius: RADIUS.pill,
                backgroundColor: palette.btnPrimaryBg,
                borderWidth: 1,
                borderColor: palette.btnPrimaryBg,
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
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderWidth: 1,
            borderRadius: RADIUS.md,
            marginHorizontal: SPACING.lg,
            marginTop: SPACING.md,
            paddingHorizontal: SPACING.md,
            height: 42,
          }}
        >
          <Ionicons name="search" size={16} color={palette.textTertiary} />
          <TextInput
            testID="ganado-search-input"
            style={{
              flex: 1,
              marginLeft: SPACING.sm,
              fontSize: FONT_SIZE.base,
              color: palette.text,
            }}
            placeholder="Buscar por nombre, arete o raza…"
            placeholderTextColor={palette.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={palette.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filters */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: SPACING.lg,
            marginTop: SPACING.md,
          }}
        >
          {TYPE_FILTERS.map((f) => {
            const active = filterType === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`ganado-filter-${f.key}`}
                onPress={() => setFilterType(f.key)}
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
          keyExtractor={(item) => item.animal_id}
          renderItem={renderAnimal}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.sm,
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAnimals();
              }}
              tintColor={palette.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="paw-outline" size={28} color={palette.textTertiary} />}
              title="Sin resultados"
              subtitle="Ajusta los filtros o agrega un nuevo animal."
            />
          }
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}
