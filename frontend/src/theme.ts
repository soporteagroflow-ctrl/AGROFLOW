export const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  secondary: '#D84315',
  secondaryLight: '#FF7043',
  background: '#1A1816',
  surface: '#2D2A26',
  surfaceLight: '#3D3A36',
  border: '#45403B',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  muted: '#8D8D8D',
  error: '#CF6679',
  success: '#4CAF50',
  warning: '#FFA726',
  info: '#42A5F5',
  white: '#FFFFFF',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 36,
};

export const ANIMAL_TYPES: Record<string, string> = {
  vaca: 'Vaca',
  toro: 'Toro',
  ternero: 'Ternero',
  novilla: 'Novilla',
};

export const ANIMAL_STATUS: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: '#4CAF50' },
  vendido: { label: 'Vendido', color: '#42A5F5' },
  muerto: { label: 'Muerto', color: '#CF6679' },
};

export const GRASS_STATUS: Record<string, { label: string; color: string }> = {
  bueno: { label: 'Bueno', color: '#4CAF50' },
  regular: { label: 'Regular', color: '#FFA726' },
  malo: { label: 'Malo', color: '#CF6679' },
};

export const PADDOCK_STATUS: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: '#4CAF50' },
  en_descanso: { label: 'En Descanso', color: '#FFA726' },
  mantenimiento: { label: 'Mantenimiento', color: '#42A5F5' },
};

export const FINANCE_CATEGORIES: Record<string, string> = {
  venta_ganado: 'Venta de Ganado',
  venta_leche: 'Venta de Leche',
  compra_alimento: 'Compra de Alimento',
  veterinario: 'Veterinario',
  mantenimiento: 'Mantenimiento',
  personal: 'Personal',
  transporte: 'Transporte',
  otros: 'Otros',
};
