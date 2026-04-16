import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createAnimal, getPaddocks } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

export default function NuevoAnimalScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [paddocks, setPaddocks] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', tag_id: '', breed: '', animal_type: 'vaca',
    birth_date: '', weight: '', sex: 'hembra', paddock_id: '', notes: '',
  });

  useEffect(() => {
    getPaddocks().then(r => setPaddocks(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await createAnimal({ ...form, weight: form.weight ? parseFloat(form.weight) : 0 });
      router.back();
    } catch (e) { console.log('Error:', e); }
    finally { setSaving(false); }
  };

  const types = [
    { key: 'vaca', label: 'Vaca', icon: 'female' },
    { key: 'toro', label: 'Toro', icon: 'male' },
    { key: 'ternero', label: 'Ternero', icon: 'happy' },
    { key: 'novilla', label: 'Novilla', icon: 'flower' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="nuevo-animal-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Animal</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput testID="nuevo-animal-name" style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Nombre del animal" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>
            {types.map(t => (
              <TouchableOpacity
                key={t.key}
                testID={`nuevo-animal-type-${t.key}`}
                style={[styles.typeBtn, form.animal_type === t.key && styles.typeBtnActive]}
                onPress={() => setForm({ ...form, animal_type: t.key })}
              >
                <Ionicons name={t.icon as any} size={20} color={form.animal_type === t.key ? COLORS.white : COLORS.muted} />
                <Text style={[styles.typeBtnText, form.animal_type === t.key && { color: COLORS.white }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Sexo</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity
              testID="nuevo-animal-sex-hembra"
              style={[styles.sexBtn, form.sex === 'hembra' && styles.sexBtnActive]}
              onPress={() => setForm({ ...form, sex: 'hembra' })}
            >
              <Ionicons name="female" size={20} color={form.sex === 'hembra' ? COLORS.white : COLORS.muted} />
              <Text style={[styles.sexBtnText, form.sex === 'hembra' && { color: COLORS.white }]}>Hembra</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="nuevo-animal-sex-macho"
              style={[styles.sexBtn, form.sex === 'macho' && styles.sexBtnActive]}
              onPress={() => setForm({ ...form, sex: 'macho' })}
            >
              <Ionicons name="male" size={20} color={form.sex === 'macho' ? COLORS.white : COLORS.muted} />
              <Text style={[styles.sexBtnText, form.sex === 'macho' && { color: COLORS.white }]}>Macho</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Número de Arete</Text>
          <TextInput testID="nuevo-animal-tag" style={styles.input} value={form.tag_id} onChangeText={v => setForm({ ...form, tag_id: v })} placeholder="A001" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Raza</Text>
          <TextInput testID="nuevo-animal-breed" style={styles.input} value={form.breed} onChangeText={v => setForm({ ...form, breed: v })} placeholder="Angus, Brahman, Holstein..." placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput testID="nuevo-animal-weight" style={styles.input} value={form.weight} onChangeText={v => setForm({ ...form, weight: v })} keyboardType="numeric" placeholder="450" placeholderTextColor={COLORS.muted} />

          <Text style={styles.label}>Fecha Nacimiento (YYYY-MM-DD)</Text>
          <TextInput testID="nuevo-animal-birth" style={styles.input} value={form.birth_date} onChangeText={v => setForm({ ...form, birth_date: v })} placeholder="2022-01-15" placeholderTextColor={COLORS.muted} />

          {paddocks.length > 0 && (
            <>
              <Text style={styles.label}>Potrero</Text>
              <View style={styles.paddockGrid}>
                <TouchableOpacity
                  style={[styles.paddockChip, !form.paddock_id && styles.paddockChipActive]}
                  onPress={() => setForm({ ...form, paddock_id: '' })}
                >
                  <Text style={[styles.paddockChipText, !form.paddock_id && styles.paddockChipTextActive]}>Sin asignar</Text>
                </TouchableOpacity>
                {paddocks.map(p => (
                  <TouchableOpacity
                    key={p.paddock_id}
                    style={[styles.paddockChip, form.paddock_id === p.paddock_id && styles.paddockChipActive]}
                    onPress={() => setForm({ ...form, paddock_id: p.paddock_id })}
                  >
                    <Text style={[styles.paddockChipText, form.paddock_id === p.paddock_id && styles.paddockChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Notas</Text>
          <TextInput testID="nuevo-animal-notes" style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} placeholder="Observaciones..." placeholderTextColor={COLORS.muted} multiline />

          <TouchableOpacity testID="nuevo-animal-submit" style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Guardar Animal</Text>}
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
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  sexRow: { flexDirection: 'row', gap: SPACING.sm },
  sexBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  sexBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sexBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  paddockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  paddockChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  paddockChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paddockChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  paddockChipTextActive: { color: COLORS.white },
  submitBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
