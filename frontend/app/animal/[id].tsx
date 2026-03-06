import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAnimal, deleteAnimal, getHealthRecords, getWeightRecords, addHealthRecord, addWeightRecord } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE, ANIMAL_TYPES, ANIMAL_STATUS } from '../../src/theme';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [animal, setAnimal] = useState<any>(null);
  const [health, setHealth] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [healthForm, setHealthForm] = useState({ record_type: 'vacuna', description: '', date: '', veterinarian: '' });
  const [weightForm, setWeightForm] = useState({ weight: '', date: '', notes: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [aRes, hRes, wRes] = await Promise.all([
        getAnimal(id!),
        getHealthRecords(id!),
        getWeightRecords(id!),
      ]);
      setAnimal(aRes.data);
      setHealth(hRes.data);
      setWeights(wRes.data);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteAnimal(id!);
      router.back();
    } catch (e) { console.log('Error:', e); }
  };

  const handleAddHealth = async () => {
    if (!healthForm.description) return;
    try {
      await addHealthRecord(id!, healthForm);
      setShowHealthModal(false);
      setHealthForm({ record_type: 'vacuna', description: '', date: '', veterinarian: '' });
      fetchData();
    } catch (e) { console.log('Error:', e); }
  };

  const handleAddWeight = async () => {
    if (!weightForm.weight) return;
    try {
      await addWeightRecord(id!, { ...weightForm, weight: parseFloat(weightForm.weight) });
      setShowWeightModal(false);
      setWeightForm({ weight: '', date: '', notes: '' });
      fetchData();
    } catch (e) { console.log('Error:', e); }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  }

  if (!animal) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>Animal no encontrado</Text></View></SafeAreaView>;
  }

  const status = ANIMAL_STATUS[animal.status] || ANIMAL_STATUS.activo;
  const healthTypes = [
    { key: 'vacuna', label: 'Vacuna', icon: 'medkit', color: '#4CAF50' },
    { key: 'tratamiento', label: 'Tratamiento', icon: 'bandage', color: '#FF9800' },
    { key: 'revision', label: 'Revisión', icon: 'eye', color: '#2196F3' },
    { key: 'enfermedad', label: 'Enfermedad', icon: 'warning', color: '#CF6679' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="animal-detail-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{animal.name}</Text>
        <TouchableOpacity testID="animal-detail-delete" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#CF6679" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Animal Header Card */}
        <View style={styles.animalHeader}>
          <View style={[styles.bigAvatar, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={animal.sex === 'macho' ? 'male' : 'female'} size={40} color={status.color} />
          </View>
          <View style={styles.animalMainInfo}>
            <Text style={styles.animalName}>{animal.name}</Text>
            <Text style={styles.animalTag}>#{animal.tag_id || 'Sin arete'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ANIMAL_TYPES[animal.animal_type] || animal.animal_type}</Text>
            <Text style={styles.statLabel}>Tipo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{animal.breed || '-'}</Text>
            <Text style={styles.statLabel}>Raza</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{animal.weight || 0} kg</Text>
            <Text style={styles.statLabel}>Peso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{animal.birth_date || '-'}</Text>
            <Text style={styles.statLabel}>Nacimiento</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['info', 'salud', 'peso'].map(t => (
            <TouchableOpacity
              key={t}
              testID={`animal-tab-${t}`}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'info' ? 'Información' : t === 'salud' ? 'Historial Salud' : 'Registro Peso'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'info' && (
          <View style={styles.infoSection}>
            <InfoRow label="Sexo" value={animal.sex === 'macho' ? 'Macho' : 'Hembra'} />
            <InfoRow label="Notas" value={animal.notes || 'Sin notas'} />
            <InfoRow label="Potrero" value={animal.paddock_id || 'Sin asignar'} />
            <InfoRow label="Registrado" value={animal.created_at?.split('T')[0] || '-'} />
          </View>
        )}

        {tab === 'salud' && (
          <View style={styles.tabContent}>
            <TouchableOpacity testID="animal-add-health" style={styles.addRecordBtn} onPress={() => setShowHealthModal(true)}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.addRecordText}>Agregar registro de salud</Text>
            </TouchableOpacity>
            {health.length === 0 ? (
              <Text style={styles.noRecords}>Sin registros sanitarios</Text>
            ) : (
              health.map((h, i) => {
                const ht = healthTypes.find(t => t.key === h.record_type) || healthTypes[0];
                return (
                  <View key={h.record_id || i} style={styles.recordCard}>
                    <View style={[styles.recordIcon, { backgroundColor: ht.color + '20' }]}>
                      <Ionicons name={ht.icon as any} size={18} color={ht.color} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordType}>{ht.label}</Text>
                      <Text style={styles.recordDesc}>{h.description}</Text>
                      <Text style={styles.recordDate}>{h.date} {h.veterinarian ? `· ${h.veterinarian}` : ''}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === 'peso' && (
          <View style={styles.tabContent}>
            <TouchableOpacity testID="animal-add-weight" style={styles.addRecordBtn} onPress={() => setShowWeightModal(true)}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.addRecordText}>Registrar peso</Text>
            </TouchableOpacity>
            {weights.length === 0 ? (
              <Text style={styles.noRecords}>Sin registros de peso</Text>
            ) : (
              weights.map((w, i) => (
                <View key={w.record_id || i} style={styles.recordCard}>
                  <View style={[styles.recordIcon, { backgroundColor: '#4CAF5020' }]}>
                    <Ionicons name="fitness" size={18} color="#4CAF50" />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordType}>{w.weight} kg</Text>
                    <Text style={styles.recordDate}>{w.date}{w.notes ? ` · ${w.notes}` : ''}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Health Modal */}
      <Modal visible={showHealthModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registro de Salud</Text>
              <TouchableOpacity onPress={() => setShowHealthModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeGrid}>
                {healthTypes.map(ht => (
                  <TouchableOpacity
                    key={ht.key}
                    style={[styles.typeChip, healthForm.record_type === ht.key && { backgroundColor: ht.color + '30', borderColor: ht.color }]}
                    onPress={() => setHealthForm({ ...healthForm, record_type: ht.key })}
                  >
                    <Ionicons name={ht.icon as any} size={16} color={healthForm.record_type === ht.key ? ht.color : COLORS.muted} />
                    <Text style={[styles.typeChipText, healthForm.record_type === ht.key && { color: ht.color }]}>{ht.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput style={styles.input} value={healthForm.description} onChangeText={v => setHealthForm({ ...healthForm, description: v })} placeholder="Detalle del registro" placeholderTextColor={COLORS.muted} />
              <Text style={styles.label}>Veterinario</Text>
              <TextInput style={styles.input} value={healthForm.veterinarian} onChangeText={v => setHealthForm({ ...healthForm, veterinarian: v })} placeholder="Nombre del veterinario" placeholderTextColor={COLORS.muted} />
              <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={healthForm.date} onChangeText={v => setHealthForm({ ...healthForm, date: v })} placeholder="2025-01-15" placeholderTextColor={COLORS.muted} />
              <TouchableOpacity testID="animal-health-submit" style={styles.submitBtn} onPress={handleAddHealth}>
                <Text style={styles.submitBtnText}>Guardar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Weight Modal */}
      <Modal visible={showWeightModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registro de Peso</Text>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Peso (kg) *</Text>
            <TextInput style={styles.input} value={weightForm.weight} onChangeText={v => setWeightForm({ ...weightForm, weight: v })} keyboardType="numeric" placeholder="450" placeholderTextColor={COLORS.muted} />
            <Text style={styles.label}>Notas</Text>
            <TextInput style={styles.input} value={weightForm.notes} onChangeText={v => setWeightForm({ ...weightForm, notes: v })} placeholder="Notas adicionales" placeholderTextColor={COLORS.muted} />
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={weightForm.date} onChangeText={v => setWeightForm({ ...weightForm, date: v })} placeholder="2025-01-15" placeholderTextColor={COLORS.muted} />
            <TouchableOpacity testID="animal-weight-submit" style={styles.submitBtn} onPress={handleAddWeight}>
              <Text style={styles.submitBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FONT_SIZE.base, color: COLORS.muted },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  animalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  animalMainInfo: { marginLeft: SPACING.md },
  animalName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.text },
  animalTag: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  quickStats: { flexDirection: 'row', marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.xs },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  tabBtnTextActive: { color: COLORS.white },
  infoSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  tabContent: { marginHorizontal: SPACING.lg, marginTop: SPACING.sm },
  addRecordBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING.sm },
  addRecordText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  noRecords: { fontSize: FONT_SIZE.sm, color: COLORS.muted, textAlign: 'center', paddingTop: SPACING.lg },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  recordIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, marginLeft: SPACING.sm },
  recordType: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  recordDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  recordDate: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 48, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  submitBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
