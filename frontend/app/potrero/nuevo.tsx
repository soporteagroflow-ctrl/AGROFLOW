import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createPaddock } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

export default function NuevoPotrero() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', area_hectares: '', grass_type: '', grass_status: 'bueno',
    capacity: '', center_lat: '', center_lng: '', status: 'activo', notes: '',
  });

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await createPaddock({
        ...form,
        area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : 0,
        capacity: form.capacity ? parseInt(form.capacity) : 0,
        center_lat: form.center_lat ? parseFloat(form.center_lat) : 4.609,
        center_lng: form.center_lng ? parseFloat(form.center_lng) : -74.082,
        coordinates: [],
      });
      router.back();
    } catch (e) { console.log('Error:', e); }
    finally { setSaving(false); }
  };

  const grassOptions = [
    { key: 'bueno', label: 'Bueno', color: '#4CAF50' },
    { key: 'regular', label: 'Regular', color: '#FFA726' },
    { key: 'malo', label: 'Malo', color: '#CF6679' },
  ];

  const statusOptions = [
    { key: 'activo', label: 'Activo', color: '#4CAF50' },
    { key: 'en_descanso', label: 'En Descanso', color: '#FFA726' },
    { key: 'mantenimiento', label: 'Mantenimiento', color: '#42A5F5' },
  ];

  const grassTypes = ['Brachiaria', 'Estrella', 'Guinea', 'Kikuyo', 'Pangola', 'Otro'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="nuevo-potrero-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Potrero</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput testID="nuevo-potrero-name" style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Potrero Norte" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Área (hectáreas)</Text>
          <TextInput testID="nuevo-potrero-area" style={styles.input} value={form.area_hectares} onChangeText={v => setForm({ ...form, area_hectares: v })} keyboardType="numeric" placeholder="15" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Tipo de Pasto</Text>
          <View style={styles.chipGrid}>
            {grassTypes.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.grass_type === g && styles.chipActive]}
                onPress={() => setForm({ ...form, grass_type: g })}
              >
                <Text style={[styles.chipText, form.grass_type === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Estado del Pasto</Text>
          <View style={styles.statusRow}>
            {grassOptions.map(g => (
              <TouchableOpacity
                key={g.key}
                style={[styles.statusBtn, form.grass_status === g.key && { backgroundColor: g.color + '20', borderColor: g.color }]}
                onPress={() => setForm({ ...form, grass_status: g.key })}
              >
                <View style={[styles.dot, { backgroundColor: g.color }]} />
                <Text style={[styles.statusBtnText, form.grass_status === g.key && { color: g.color }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Estado del Potrero</Text>
          <View style={styles.statusRow}>
            {statusOptions.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.statusBtn, form.status === s.key && { backgroundColor: s.color + '20', borderColor: s.color }]}
                onPress={() => setForm({ ...form, status: s.key })}
              >
                <Text style={[styles.statusBtnText, form.status === s.key && { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Capacidad (animales)</Text>
          <TextInput testID="nuevo-potrero-capacity" style={styles.input} value={form.capacity} onChangeText={v => setForm({ ...form, capacity: v })} keyboardType="numeric" placeholder="20" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Coordenadas GPS</Text>
          <View style={styles.coordRow}>
            <TextInput testID="nuevo-potrero-lat" style={[styles.input, { flex: 1 }]} value={form.center_lat} onChangeText={v => setForm({ ...form, center_lat: v })} keyboardType="numeric" placeholder="Latitud (4.609)" placeholderTextColor={COLORS.muted} />
            <TextInput testID="nuevo-potrero-lng" style={[styles.input, { flex: 1 }]} value={form.center_lng} onChangeText={v => setForm({ ...form, center_lng: v })} keyboardType="numeric" placeholder="Longitud (-74.082)" placeholderTextColor={COLORS.muted} />
          </View>

          <Text style={styles.label}>Notas</Text>
          <TextInput testID="nuevo-potrero-notes" style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} placeholder="Observaciones..." placeholderTextColor={COLORS.muted} multiline />

          <TouchableOpacity testID="nuevo-potrero-submit" style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Guardar Potrero</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  form: { paddingHorizontal: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 48, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.text },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  statusRow: { flexDirection: 'row', gap: SPACING.sm },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statusBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  coordRow: { flexDirection: 'row', gap: SPACING.sm },
  submitBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
