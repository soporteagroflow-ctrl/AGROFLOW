// AgroFlow theme — Hugging Face Storage inspired.
// Dark-first palette with a matching light mode.

export type ThemeMode = 'dark' | 'light';

export interface Palette {
  // Surfaces
  background: string;      // app background
  surface: string;         // cards
  surfaceElevated: string; // inset panels / terminals
  surfaceHover: string;    // hover/pressed state
  border: string;          // hairline borders
  borderStrong: string;    // stronger dividers

  // Text
  text: string;            // primary
  textSecondary: string;   // secondary / muted
  textTertiary: string;    // captions / subtle
  textInverse: string;     // text on white pill buttons

  // Brand accent (HF blue)
  accent: string;
  accentSoft: string;      // tinted background for accent pills
  accentFg: string;        // text on accent

  // Secondary accents (used categorically by the domain)
  teal: string;
  tealSoft: string;
  orange: string;
  orangeSoft: string;
  purple: string;
  purpleSoft: string;
  pink: string;
  pinkSoft: string;
  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;
  yellow: string;
  yellowSoft: string;

  // Buttons
  btnPrimaryBg: string;    // HF "white pill"
  btnPrimaryFg: string;
  btnSecondaryBg: string;  // dark pill
  btnSecondaryFg: string;
  btnSecondaryBorder: string;
}

const dark: Palette = {
  background: '#0B0F1A',
  surface: '#121826',
  surfaceElevated: '#0E1422',
  surfaceHover: '#1A2133',
  border: '#1F2A3D',
  borderStrong: '#2A3650',

  text: '#F5F7FA',
  textSecondary: '#A8B0BE',
  textTertiary: '#6E7687',
  textInverse: '#0B0F1A',

  accent: '#2F7BF6',
  accentSoft: 'rgba(47,123,246,0.14)',
  accentFg: '#FFFFFF',

  teal: '#2DD4BF',
  tealSoft: 'rgba(45,212,191,0.14)',
  orange: '#F59E0B',
  orangeSoft: 'rgba(245,158,11,0.14)',
  purple: '#A78BFA',
  purpleSoft: 'rgba(167,139,250,0.14)',
  pink: '#F472B6',
  pinkSoft: 'rgba(244,114,182,0.14)',
  green: '#22C55E',
  greenSoft: 'rgba(34,197,94,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.14)',
  yellow: '#FACC15',
  yellowSoft: 'rgba(250,204,21,0.14)',

  btnPrimaryBg: '#F5F7FA',
  btnPrimaryFg: '#0B0F1A',
  btnSecondaryBg: '#1A2133',
  btnSecondaryFg: '#F5F7FA',
  btnSecondaryBorder: '#2A3650',
};

const light: Palette = {
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F2F4F7',
  surfaceHover: '#EEF1F5',
  border: '#E5E8EE',
  borderStrong: '#D0D5DD',

  text: '#0B0F1A',
  textSecondary: '#4A5466',
  textTertiary: '#7D8699',
  textInverse: '#FFFFFF',

  accent: '#1F6FEB',
  accentSoft: 'rgba(31,111,235,0.12)',
  accentFg: '#FFFFFF',

  teal: '#0D9488',
  tealSoft: 'rgba(13,148,136,0.12)',
  orange: '#D97706',
  orangeSoft: 'rgba(217,119,6,0.12)',
  purple: '#7C3AED',
  purpleSoft: 'rgba(124,58,237,0.12)',
  pink: '#DB2777',
  pinkSoft: 'rgba(219,39,119,0.12)',
  green: '#16A34A',
  greenSoft: 'rgba(22,163,74,0.12)',
  red: '#DC2626',
  redSoft: 'rgba(220,38,38,0.12)',
  yellow: '#CA8A04',
  yellowSoft: 'rgba(202,138,4,0.12)',

  btnPrimaryBg: '#0B0F1A',
  btnPrimaryFg: '#FFFFFF',
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryFg: '#0B0F1A',
  btnSecondaryBorder: '#D0D5DD',
};

export const PALETTES: Record<ThemeMode, Palette> = { dark, light };

// Spacing scale (keep existing keys for compatibility).
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
  title: 44,
  hero: 56,
};

export const FONT = {
  // System sans. On web this resolves to Inter-like defaults via _html.tsx.
  sans: undefined as unknown as string,
  mono: 'Menlo, Consolas, "SF Mono", monospace',
};

// Subtle shadow tokens.
export const SHADOW = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Domain label maps (stay here for convenience).
export const ANIMAL_TYPES: Record<string, string> = {
  vaca: 'Vaca',
  toro: 'Toro',
  ternero: 'Ternero',
  novilla: 'Novilla',
};

// Categorical colors per domain — keys map to palette accent names so that
// the actual hex switches with the theme.
export type AccentKey =
  | 'accent'
  | 'teal'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'green'
  | 'red'
  | 'yellow';

export const ANIMAL_TYPE_ACCENT: Record<string, AccentKey> = {
  vaca: 'accent',
  toro: 'purple',
  ternero: 'orange',
  novilla: 'pink',
};

export const ANIMAL_STATUS_LABEL: Record<string, { label: string; accent: AccentKey }> = {
  activo: { label: 'Activo', accent: 'green' },
  vendido: { label: 'Vendido', accent: 'accent' },
  muerto: { label: 'Baja', accent: 'red' },
};

export const GRASS_STATUS_LABEL: Record<string, { label: string; accent: AccentKey }> = {
  bueno: { label: 'Bueno', accent: 'green' },
  regular: { label: 'Regular', accent: 'yellow' },
  malo: { label: 'Malo', accent: 'red' },
};

export const PADDOCK_STATUS_LABEL: Record<string, { label: string; accent: AccentKey }> = {
  activo: { label: 'Activo', accent: 'green' },
  en_descanso: { label: 'En descanso', accent: 'orange' },
  mantenimiento: { label: 'Mantenimiento', accent: 'accent' },
};

export const SEVERITY_LABEL: Record<string, { label: string; accent: AccentKey }> = {
  alta: { label: 'Alta', accent: 'red' },
  media: { label: 'Media', accent: 'orange' },
  baja: { label: 'Baja', accent: 'accent' },
};

export const FINANCE_CATEGORIES: Record<string, string> = {
  venta_ganado: 'Venta de ganado',
  venta_leche: 'Venta de leche',
  compra_alimento: 'Compra de alimento',
  veterinario: 'Veterinario',
  mantenimiento: 'Mantenimiento',
  personal: 'Personal',
  transporte: 'Transporte',
  otros: 'Otros',
};

// Backwards-compat facade for legacy imports. Points at the dark palette; any
// NEW code should use `useTheme()` to get the active palette.
export const COLORS = {
  primary: dark.accent,
  primaryLight: dark.accent,
  secondary: dark.orange,
  secondaryLight: dark.orange,
  background: dark.background,
  surface: dark.surface,
  surfaceLight: dark.surfaceHover,
  border: dark.border,
  text: dark.text,
  textSecondary: dark.textSecondary,
  muted: dark.textTertiary,
  error: dark.red,
  success: dark.green,
  warning: dark.orange,
  info: dark.accent,
  white: '#FFFFFF',
  black: '#000000',
};

// Legacy helpers kept for screens that still import them.
export const ANIMAL_STATUS: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: dark.green },
  vendido: { label: 'Vendido', color: dark.accent },
  muerto: { label: 'Baja', color: dark.red },
};
export const GRASS_STATUS: Record<string, { label: string; color: string }> = {
  bueno: { label: 'Bueno', color: dark.green },
  regular: { label: 'Regular', color: dark.yellow },
  malo: { label: 'Malo', color: dark.red },
};
export const PADDOCK_STATUS: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: dark.green },
  en_descanso: { label: 'En descanso', color: dark.orange },
  mantenimiento: { label: 'Mantenimiento', color: dark.accent },
};
