import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore, useToastStore } from '../../src/store';
import { logout, updateProfile } from '../../src/api';
import {
  syncPendingOperations,
  getPendingCount,
  getLastSyncTime,
  clearCache,
  isOnline,
} from '../../src/offline';
import { FONT_SIZE, RADIUS, SPACING } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import {
  Button,
  Card,
  Divider,
  Input,
  Pill,
  ScreenBackground,
  Section,
  StatDot,
} from '../../src/ui';

export default function PerfilScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const toast = useToastStore();
  const { palette, mode, toggleMode } = useTheme();
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
    if (!farmName.trim()) {
      toast.show('Ingresa un nombre para la finca', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({ farm_name: farmName });
      setUser(res.data);
      toast.show('Finca actualizada exitosamente', 'success');
    } catch {
      toast.show('Error al guardar la finca', 'error');
    } finally {
      setSaving(false);
    }
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
    } catch {
      setSyncResult('Error de sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    setSyncResult('Caché limpiado');
    loadOfflineStatus();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    signOut();
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg }}>
            <Text
              style={{
                color: palette.text,
                fontSize: FONT_SIZE.xxxl,
                fontWeight: '800',
                letterSpacing: -0.6,
              }}
            >
              Perfil
            </Text>
            <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 }}>
              Administra tu cuenta y preferencias
            </Text>
          </View>

          {/* User card */}
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
            <Card elevated>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: palette.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZE.xl,
                      fontWeight: '800',
                      color: palette.accentFg,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: FONT_SIZE.lg,
                      fontWeight: '700',
                    }}
                  >
                    {user?.name || 'Sin nombre'}
                  </Text>
                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.sm,
                      marginTop: 1,
                    }}
                  >
                    {user?.email || ''}
                  </Text>
                </View>
                <Pill
                  label={user?.role === 'owner' ? 'Propietario' : user?.role || 'Propietario'}
                  accent="accent"
                />
              </View>
            </Card>
          </View>

          {/* Apariencia */}
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
            <Section title="Apariencia" subtitle="Elige claro u oscuro">
              <Card padding={SPACING.md}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={mode === 'dark' ? 'moon' : 'sunny'}
                      size={18}
                      color={palette.text}
                    />
                    <Text
                      style={{
                        color: palette.text,
                        fontSize: FONT_SIZE.base,
                        fontWeight: '600',
                        marginLeft: SPACING.sm,
                      }}
                    >
                      Modo {mode === 'dark' ? 'oscuro' : 'claro'}
                    </Text>
                  </View>
                  <Button
                    label={mode === 'dark' ? 'Usar claro' : 'Usar oscuro'}
                    size="sm"
                    variant="secondary"
                    onPress={toggleMode}
                  />
                </View>
              </Card>
            </Section>
          </View>

          {/* Farm config */}
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <Section title="Finca" subtitle="Tu finca principal">
              <Card padding={SPACING.md}>
                <Input
                  testID="perfil-farm-name-input"
                  label="Nombre de la finca"
                  value={farmName}
                  onChangeText={setFarmName}
                  placeholder="Mi Finca"
                  containerStyle={{ marginBottom: SPACING.sm }}
                />
                <Button
                  testID="perfil-save-btn"
                  label="Guardar"
                  loading={saving}
                  onPress={handleSaveFarm}
                  variant="accent"
                />
              </Card>
            </Section>
          </View>

          {/* Sync */}
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <Section title="Sincronización" subtitle="Estado de tus datos offline">
              <Card padding={SPACING.md}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <StatDot accent={online ? 'green' : 'red'} />
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: FONT_SIZE.sm,
                      fontWeight: '600',
                      marginLeft: 6,
                    }}
                  >
                    {online ? 'Conectado' : 'Sin conexión'}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm }}
                >
                  <Ionicons name="time" size={14} color={palette.textSecondary} />
                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.sm,
                      marginLeft: 6,
                    }}
                  >
                    Última sincronización: {lastSync}
                  </Text>
                </View>
                {pendingOps > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: SPACING.sm,
                    }}
                  >
                    <Ionicons name="cloud-upload" size={14} color={palette.orange} />
                    <Text
                      style={{
                        color: palette.orange,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: '600',
                        marginLeft: 6,
                      }}
                    >
                      {pendingOps} operaciones pendientes
                    </Text>
                  </View>
                )}

                <Divider />
                <Button
                  testID="perfil-sync-btn"
                  label={syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
                  loading={syncing}
                  variant="accent"
                  icon={<Ionicons name="sync" size={16} color={palette.accentFg} />}
                  onPress={handleSync}
                />
                {!!syncResult && (
                  <Text
                    style={{
                      color: palette.accent,
                      fontSize: FONT_SIZE.sm,
                      textAlign: 'center',
                      marginTop: SPACING.sm,
                      fontWeight: '600',
                    }}
                  >
                    {syncResult}
                  </Text>
                )}

                <Pressable
                  testID="perfil-clear-cache"
                  onPress={handleClearCache}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: SPACING.md,
                    marginTop: SPACING.xs,
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={palette.textSecondary} />
                  <Text
                    style={{
                      color: palette.textSecondary,
                      fontSize: FONT_SIZE.sm,
                      marginLeft: 6,
                    }}
                  >
                    Limpiar caché local
                  </Text>
                </Pressable>
              </Card>
            </Section>
          </View>

          {/* About */}
          <View style={{ paddingHorizontal: SPACING.lg }}>
            <Section title="Acerca de">
              <Card padding={SPACING.md}>
                {[
                  ['Versión', '2.0.0'],
                  ['Motor de alertas', 'Basado en reglas (sin costo)'],
                  ['Mapas', 'OpenStreetMap + NDVI'],
                  ['Modo offline', 'Habilitado'],
                ].map(([label, value], i, arr) => (
                  <View key={label}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                      }}
                    >
                      <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm }}>
                        {label}
                      </Text>
                      <Text
                        style={{
                          color: palette.text,
                          fontSize: FONT_SIZE.sm,
                          fontWeight: '600',
                        }}
                      >
                        {value}
                      </Text>
                    </View>
                    {i < arr.length - 1 && <Divider style={{ marginVertical: 0 }} />}
                  </View>
                ))}
              </Card>
            </Section>
          </View>

          {/* Logout */}
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
            <Button
              testID="perfil-logout-btn"
              label="Cerrar sesión"
              variant="danger"
              icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
              onPress={handleLogout}
              size="lg"
            />
          </View>

          <Text
            style={{
              color: palette.textTertiary,
              fontSize: FONT_SIZE.xs,
              textAlign: 'center',
              marginTop: SPACING.lg,
            }}
          >
            AgroFlow v2.0.0 · Pensado para el campo
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
