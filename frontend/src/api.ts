import axios from 'axios';
import { auth } from './firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token may have expired, try to refresh
      const user = auth.currentUser;
      if (user) {
        try {
          await user.getIdToken(true); // force refresh
        } catch {
          // If refresh fails, sign out
          await auth.signOut();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const firebaseLogin = (idToken: string) =>
  api.post('/auth/firebase', { id_token: idToken });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const updateProfile = (data: { farm_name?: string; role?: string }) =>
  api.put('/auth/profile', data);

// Animals
export const getAnimals = () => api.get('/animals');
export const getAnimal = (id: string) => api.get(`/animals/${id}`);
export const createAnimal = (data: any) => api.post('/animals', data);
export const updateAnimal = (id: string, data: any) => api.put(`/animals/${id}`, data);
export const deleteAnimal = (id: string) => api.delete(`/animals/${id}`);

// Health Records
export const getHealthRecords = (animalId: string) => api.get(`/animals/${animalId}/health`);
export const addHealthRecord = (animalId: string, data: any) => api.post(`/animals/${animalId}/health`, data);

// Weight Records
export const getWeightRecords = (animalId: string) => api.get(`/animals/${animalId}/weight`);
export const addWeightRecord = (animalId: string, data: any) => api.post(`/animals/${animalId}/weight`, data);

// Paddocks
export const getPaddocks = () => api.get('/paddocks');
export const getPaddock = (id: string) => api.get(`/paddocks/${id}`);
export const createPaddock = (data: any) => api.post('/paddocks', data);
export const updatePaddock = (id: string, data: any) => api.put(`/paddocks/${id}`, data);
export const deletePaddock = (id: string) => api.delete(`/paddocks/${id}`);

// Finance
export const getFinances = () => api.get('/finances');
export const createFinance = (data: any) => api.post('/finances', data);
export const deleteFinance = (id: string) => api.delete(`/finances/${id}`);
export const getFinanceSummary = () => api.get('/finances/summary');

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Alerts (rule-based, no AI)
export const getAlerts = () => api.get('/alerts');

// NDVI / Satellite
export const getNDVIData = () => api.get('/ndvi');

// Offline Sync
export const syncOfflineData = (operations: any[]) =>
  api.post('/sync', { operations });

// Seed
export const seedData = () => api.post('/seed');

// Photos
export const getAnimalPhotos = (animalId: string) => api.get(`/animals/${animalId}/photos`);
export const uploadAnimalPhoto = (animalId: string, data: { animal_id: string; photo_base64: string; description: string }) =>
  api.post(`/animals/${animalId}/photo`, data);
export const deleteAnimalPhoto = (animalId: string, photoId: string) =>
  api.delete(`/animals/${animalId}/photos/${photoId}`);

// Export
export const exportAnimalsCSV = () => api.get('/export/animals', { responseType: 'blob' });
export const exportFinancesCSV = () => api.get('/export/finances', { responseType: 'blob' });

// Audit
export const getAuditLogs = () => api.get('/audit-logs');

export default api;
