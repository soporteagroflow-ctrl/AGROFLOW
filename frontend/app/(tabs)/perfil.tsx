import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { logout, updateProfile } from '../../src/api';
import { syncPendingOperations, getPendingCount, getLastSyncTime, clearCache, isOnline } from '../../src/offline';
import { COLORS, SPACING, FONT_SIZE } from '../../src/theme';

export default function PerfilScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const [farmName, setFarmName] = useState(user?.farm_name || '');
  const [saving, setSaving] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [lastSync, setLastSync] = useState('Nunca');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    loadOfflineStatus();
  }, []);

  const loadOfflineStatus = async () => {
    const pending = await getPendingCount();
    const syncTime = await getLastSyncTime();
    const isOn = await isOnline();
    setPendingOps(pending);
    setLastSync(syncTime);
    setOnline(isOn);
  };

  const handleSaveFarm = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ farm_name: farmName });
      setUser(res.data);
    } catch (e) { console.log('Error:', e); }
    finally { setSaving(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult('');
    try {
      const result = await syncPendingOperations();
      if (result.synced > 0) {
        setSyncResult(`${result.synced} operaciones sincronizadas`);
      } else if (result.errors > 0) {
        setSyncResult('Error al sincronizar. Intenta de nuevo.');
      } else {
        setSyncResult('No hay operaciones pendientes');
      }
      loadOfflineStatus();
    } catch (e) {
      setSyncResult('Error de sincronización');
    }
    finally { setSyncing(false); }
  };

  const handleClearCache = async () => {
    await clearCache();
    setSyncResult('Caché limpiado');
    loadOfflineStatus();
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) {}
    signOut();
  };

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

        {/* Offline & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronización y Datos</Text>
          <Text style={styles.sectionDesc}>Gestiona tus datos offline</Text>

          {/* Connection Status */}
          <View style={styles.syncStatusCard}>
            <View style={styles.syncStatusRow}>
              <View style={[styles.connectionDot, { backgroundColor: online ? '#4CAF50' : '#CF6679' }]} />
              <Text style={styles.syncStatusText}>{online ? 'Conectado' : 'Sin conexión'}</Text>
            </View>
            <View style={styles.syncStatusRow}>
              <Ionicons name="time" size={16} color={COLORS.textSecondary} />
              <Text style={styles.syncStatusText}>Última sincronización: {lastSync}</Text>
            </View>
            {pendingOps > 0 && (
              <View style={styles.syncStatusRow}>
                <Ionicons name="cloud-upload" size={16} color={COLORS.warning} />
                <Text style={[styles.syncStatusText, { color: COLORS.warning }]}>{pendingOps} operaciones pendientes</Text>
              </View>
            )}
          </View>

          {/* Sync Button */}
          <TouchableOpacity testID="perfil-sync-btn" style={styles.syncButton} onPress={handleSync} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="sync" size={20} color={COLORS.white} />
                <Text style={styles.syncButtonText}>Sincronizar Ahora</Text>
              </>
            )}
          </TouchableOpacity>

          {syncResult ? (
            <Text style={styles.syncResult}>{syncResult}</Text>
          ) : null}

          {/* Clear Cache */}
          <TouchableOpacity testID="perfil-clear-cache" style={styles.clearCacheBtn} onPress={handleClearCache}>
            <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.clearCacheText}>Limpiar caché local</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versión</Text>
              <Text style={styles.infoValue}>2.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Motor de alertas</Text>
              <Text style={styles.infoValue}>Basado en reglas (sin costo)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mapas</Text>
              <Text style={styles.infoValue}>OpenStreetMap + NDVI</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Modo offline</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary }]}>Habilitado</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity testID="perfil-logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#CF6679" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AgroFlow v2.0.0 - Cero costos de IA</Text>
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
  syncStatusCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  syncStatusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  connectionDot: { width: 10, height: 10, borderRadius: 5 },
  syncStatusText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: '#1565C0', height: 48, borderRadius: 10, marginTop: SPACING.md },
  syncButtonText: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.white },
  syncResult: { fontSize: FONT_SIZE.sm, color: COLORS.primary, textAlign: 'center', marginTop: SPACING.sm, fontWeight: '600' },
  clearCacheBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, marginTop: SPACING.xs },
  clearCacheText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginTop: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: 12, height: 52, borderWidth: 1, borderColor: '#CF667940' },
  logoutText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: '#CF6679' },
  version: { fontSize: FONT_SIZE.xs, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.lg },
});
