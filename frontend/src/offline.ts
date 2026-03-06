import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineData } from './api';

const CACHE_KEYS = {
  animals: 'cache_animals',
  paddocks: 'cache_paddocks',
  finances: 'cache_finances',
  dashboard: 'cache_dashboard',
  alerts: 'cache_alerts',
  ndvi: 'cache_ndvi',
  lastSync: 'cache_last_sync',
};

const QUEUE_KEY = 'offline_queue';

// Check network status
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return true;
  }
}

// Cache data
export async function cacheData(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.log('Cache write error:', e);
  }
}

// Get cached data
export async function getCachedData(key: string): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch {
    return null;
  }
}

// Get last sync time
export async function getLastSyncTime(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.lastSync);
    if (!raw) return 'Nunca';
    const ts = JSON.parse(raw);
    const d = new Date(ts);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return 'Nunca';
  }
}

export async function setLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.lastSync, JSON.stringify(Date.now()));
}

// Queue offline operation
export async function queueOperation(operation: { type: string; data: any }): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...operation, queued_at: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.log('Queue error:', e);
  }
}

// Get pending operations count
export async function getPendingCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
}

// Sync pending operations
export async function syncPendingOperations(): Promise<{ synced: number; errors: number }> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return { synced: 0, errors: 0 };
    const queue = JSON.parse(raw);
    if (queue.length === 0) return { synced: 0, errors: 0 };

    const online = await isOnline();
    if (!online) return { synced: 0, errors: queue.length };

    const res = await syncOfflineData(queue);
    // Clear queue after sync
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    await setLastSyncTime();

    return {
      synced: res.data.created || 0,
      errors: (res.data.errors || []).length,
    };
  } catch (e) {
    console.log('Sync error:', e);
    return { synced: 0, errors: 1 };
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  const keys = Object.values(CACHE_KEYS);
  await AsyncStorage.multiRemove(keys);
}

export { CACHE_KEYS };
