import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { logout, updateProfile, getAIPrediction } from '../../src/api';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

export default function PerfilScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const [farmName, setFarmName] = useState(user?.farm_name || '');
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedAI, setSelectedAI] = useState('');

  const handleSaveFarm = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ farm_name: farmName });
      setUser(res.data);
    } catch (e) { console.log('Error:', e); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) {}
    signOut();
  };

  const handleAI = async (type: string) => {
    setSelectedAI(type);
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await getAIPrediction(type);
      setAiResult(res.data.prediction);
    } catch (e) { setAiResult('Error al generar predicción. Intenta de nuevo.'); }
    finally { setAiLoading(false); }
  };

  const aiOptions = [
    { key: 'prediccion_peso', label: 'Predicción de Peso', icon: 'fitness', desc: 'Estima el crecimiento del ganado' },
    { key: 'alerta_sanitaria', label: 'Alertas Sanitarias', icon: 'medkit', desc: 'Analiza registros de salud' },
    { key: 'rotacion_potrero', label: 'Rotación de Potreros', icon: 'refresh', desc: 'Optimiza el uso de pasturas' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>{user?.role === 'owner' ? 'Propietario' : user?.role || 'Propietario'}</Text>
          </View>
        </View>

        {/* Farm Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Finca</Text>
          <View style={styles.inputRow}>
            <TextInput
              testID="perfil-farm-name-input"
              style={styles.input}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="Nombre de tu finca"
              placeholderTextColor={COLORS.muted}
            />
            <TouchableOpacity testID="perfil-save-btn" style={styles.saveBtn} onPress={handleSaveFarm} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name="checkmark" size={22} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Herramientas de IA</Text>
          <Text style={styles.sectionDesc}>Predicciones inteligentes basadas en tus datos</Text>
          {aiOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              testID={`perfil-ai-${opt.key}`}
              style={styles.aiCard}
              onPress={() => handleAI(opt.key)}
              activeOpacity={0.7}
            >
              <View style={styles.aiCardIcon}>
                <Ionicons name={opt.icon as any} size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.aiCardInfo}>
                <Text style={styles.aiCardLabel}>{opt.label}</Text>
                <Text style={styles.aiCardDesc}>{opt.desc}</Text>
              </View>
              <Ionicons name="sparkles" size={18} color={COLORS.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Result */}
        {(aiResult || aiLoading) && (
          <View style={styles.aiResultCard}>
            <View style={styles.aiResultHeader}>
              <Ionicons name="sparkles" size={18} color={COLORS.secondary} />
              <Text style={styles.aiResultTitle}>Resultado IA: {aiOptions.find(o => o.key === selectedAI)?.label}</Text>
            </View>
            {aiLoading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: 12 }} />
            ) : (
              <Text style={styles.aiResultText}>{aiResult}</Text>
            )}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity testID="perfil-logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#CF6679" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>RanchoPro v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  userCard: { alignItems: 'center', marginTop: SPACING.lg, padding: SPACING.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONT_SIZE.xxxl, fontWeight: '700', color: COLORS.white },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  userEmail: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm, backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  sectionDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  input: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 48, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.text },
  saveBtn: { width: 48, height: 48, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  aiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  aiCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary + '20', justifyContent: 'center', alignItems: 'center' },
  aiCardInfo: { flex: 1, marginLeft: SPACING.md },
  aiCardLabel: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  aiCardDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  aiResultCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.secondary + '40' },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiResultTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.secondary },
  aiResultText: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 22, marginTop: SPACING.sm },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginTop: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: 12, height: 52, borderWidth: 1, borderColor: '#CF667940' },
  logoutText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: '#CF6679' },
  version: { fontSize: FONT_SIZE.xs, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.lg },
});
