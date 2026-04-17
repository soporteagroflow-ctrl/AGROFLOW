// AgroFlow UI kit — Hugging Face Storage inspired primitives.
// All components pull colors from the active palette via useTheme().

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from './ThemeContext';
import {
  AccentKey,
  FONT,
  FONT_SIZE,
  Palette,
  RADIUS,
  SHADOW,
  SPACING,
} from './theme';

/* ----------------------------------------------------------------------
 * Utility helpers
 * -------------------------------------------------------------------- */

export function accentColor(palette: Palette, key: AccentKey): string {
  return palette[key];
}

export function accentSoft(palette: Palette, key: AccentKey): string {
  const soft = `${key}Soft` as keyof Palette;
  return (palette[soft] as string) || palette.accentSoft;
}

/* ----------------------------------------------------------------------
 * ScreenBackground — the app-level background with subtle HF radial glow
 * -------------------------------------------------------------------- */

interface ScreenBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  const { palette } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: palette.background }, style]}>
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------------
 * Section — a labeled block for lists, with optional action on the right
 * -------------------------------------------------------------------- */

interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ title, subtitle, action, children, style }: SectionProps) {
  const { palette } = useTheme();
  return (
    <View style={[{ marginBottom: SPACING.xl }, style]}>
      {(title || action) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
          }}
        >
          <View style={{ flex: 1 }}>
            {!!title && (
              <Text
                style={{
                  color: palette.text,
                  fontSize: FONT_SIZE.xl,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                }}
              >
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------------
 * Card — rounded surface with hairline border
 * -------------------------------------------------------------------- */

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, padding = SPACING.lg, elevated, onPress }: CardProps) {
  const { palette } = useTheme();
  const base: ViewStyle = {
    backgroundColor: elevated ? palette.surfaceElevated : palette.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding,
    ...(elevated ? SHADOW.md : SHADOW.sm),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          base,
          pressed && { backgroundColor: palette.surfaceHover },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/* ----------------------------------------------------------------------
 * Pill — compact tag used for categories, status, modalities (HF pills)
 * -------------------------------------------------------------------- */

interface PillProps {
  label: string;
  accent?: AccentKey;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  solid?: boolean; // solid fill vs soft fill
}

export function Pill({ label, accent = 'accent', icon, style, textStyle, solid }: PillProps) {
  const { palette } = useTheme();
  const color = accentColor(palette, accent);
  const soft = accentSoft(palette, accent);
  const bg = solid ? color : soft;
  const fg = solid ? '#FFFFFF' : color;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bg,
          borderRadius: RADIUS.pill,
          paddingVertical: 4,
          paddingHorizontal: 10,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {!!icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text
        style={[
          {
            color: fg,
            fontSize: FONT_SIZE.xs,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------------
 * Button — primary (white pill in dark mode) / secondary (dark pill) /
 * ghost. Tracks palette automatically.
 * -------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  size = 'md',
  testID,
}: ButtonProps) {
  const { palette } = useTheme();
  const sizes = {
    sm: { h: 34, px: 14, font: FONT_SIZE.sm },
    md: { h: 42, px: 18, font: FONT_SIZE.base },
    lg: { h: 52, px: 22, font: FONT_SIZE.lg },
  }[size];

  let bg: string;
  let fg: string;
  let borderColor: string | undefined;

  switch (variant) {
    case 'primary':
      bg = palette.btnPrimaryBg;
      fg = palette.btnPrimaryFg;
      borderColor = palette.btnPrimaryBg;
      break;
    case 'secondary':
      bg = palette.btnSecondaryBg;
      fg = palette.btnSecondaryFg;
      borderColor = palette.btnSecondaryBorder;
      break;
    case 'accent':
      bg = palette.accent;
      fg = palette.accentFg;
      borderColor = palette.accent;
      break;
    case 'danger':
      bg = palette.red;
      fg = '#FFFFFF';
      borderColor = palette.red;
      break;
    case 'ghost':
    default:
      bg = 'transparent';
      fg = palette.text;
      borderColor = palette.border;
      break;
  }

  const dim = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={dim ? undefined : onPress}
      disabled={dim}
      style={({ pressed }) => [
        {
          height: sizes.h,
          paddingHorizontal: sizes.px,
          borderRadius: RADIUS.pill,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: borderColor || 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: dim ? 0.55 : 1,
        },
        pressed && !dim && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {!!icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={{
              color: fg,
              fontSize: sizes.font,
              fontWeight: '600',
              letterSpacing: 0.1,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ----------------------------------------------------------------------
 * StatDot — colored dot used inline next to labels (HF categorical dots)
 * -------------------------------------------------------------------- */

export function StatDot({ accent = 'accent', size = 8 }: { accent?: AccentKey; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accentColor(palette, accent),
      }}
    />
  );
}

/* ----------------------------------------------------------------------
 * MetricCard — the big KPI card used across dashboards.
 * -------------------------------------------------------------------- */

interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: AccentKey;
  hint?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function MetricCard({
  label,
  value,
  accent = 'accent',
  hint,
  icon,
  style,
  onPress,
}: MetricCardProps) {
  const { palette } = useTheme();
  return (
    <Card onPress={onPress} style={style} padding={SPACING.lg}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <StatDot accent={accent} />
        <Text
          style={{
            color: palette.textSecondary,
            marginLeft: 6,
            fontSize: FONT_SIZE.xs,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
        <View style={{ flex: 1 }} />
        {!!icon && icon}
      </View>
      <Text
        style={{
          color: palette.text,
          fontSize: FONT_SIZE.xxxl,
          fontWeight: '700',
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      {!!hint && (
        <Text
          style={{
            color: palette.textTertiary,
            fontSize: FONT_SIZE.sm,
            marginTop: 2,
          }}
        >
          {hint}
        </Text>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------------
 * Hero — the big centered eyebrow/title/subtitle block (HF Storage hero)
 * -------------------------------------------------------------------- */

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
  pills?: { label: string; accent?: AccentKey }[];
  style?: ViewStyle;
}

export function Hero({ eyebrow, title, subtitle, cta, pills, style }: HeroProps) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          paddingVertical: SPACING.xxl,
          paddingHorizontal: SPACING.lg,
          alignItems: 'center',
        },
        style,
      ]}
    >
      {!!eyebrow && (
        <Text
          style={{
            color: palette.accent,
            fontSize: FONT_SIZE.xs,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: SPACING.md,
          }}
        >
          {eyebrow}
        </Text>
      )}
      <Text
        style={{
          color: palette.text,
          fontSize: FONT_SIZE.title,
          fontWeight: '800',
          textAlign: 'center',
          letterSpacing: -1,
          lineHeight: FONT_SIZE.title * 1.05,
        }}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text
          style={{
            color: palette.textSecondary,
            fontSize: FONT_SIZE.lg,
            textAlign: 'center',
            marginTop: SPACING.md,
            maxWidth: 640,
            lineHeight: FONT_SIZE.lg * 1.5,
          }}
        >
          {subtitle}
        </Text>
      )}
      {!!pills && pills.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: SPACING.lg,
            gap: SPACING.sm as unknown as number,
          }}
        >
          {pills.map((p, i) => (
            <View key={i} style={{ marginRight: SPACING.sm, marginBottom: SPACING.sm }}>
              <Pill label={p.label} accent={p.accent ?? 'accent'} />
            </View>
          ))}
        </View>
      )}
      {!!cta && <View style={{ marginTop: SPACING.xl }}>{cta}</View>}
    </View>
  );
}

/* ----------------------------------------------------------------------
 * Divider
 * -------------------------------------------------------------------- */

export function Divider({ style }: { style?: ViewStyle }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: palette.border,
          marginVertical: SPACING.md,
        },
        style,
      ]}
    />
  );
}

/* ----------------------------------------------------------------------
 * ListRow — HF list row with leading dot/icon, title, value, chevron.
 * -------------------------------------------------------------------- */

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  accent?: AccentKey;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ListRow({
  title,
  subtitle,
  value,
  accent,
  leading,
  trailing,
  onPress,
  style,
}: ListRowProps) {
  const { palette } = useTheme();
  const body = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.md,
        },
        style,
      ]}
    >
      {leading ? (
        <View style={{ marginRight: SPACING.md }}>{leading}</View>
      ) : accent ? (
        <View style={{ marginRight: SPACING.md }}>
          <StatDot accent={accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: FONT_SIZE.base, fontWeight: '600' }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {!!value && (
        <Text style={{ color: palette.textSecondary, fontSize: FONT_SIZE.sm, marginLeft: SPACING.sm }}>
          {value}
        </Text>
      )}
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && { backgroundColor: palette.surfaceHover, borderRadius: RADIUS.md },
        ]}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}

/* ----------------------------------------------------------------------
 * CodeBlock — HF-like terminal block for previews / instructions.
 * -------------------------------------------------------------------- */

interface CodeBlockProps {
  code: string;
  caption?: string;
  style?: ViewStyle;
}

export function CodeBlock({ code, caption, style }: CodeBlockProps) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceElevated,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        },
        style,
      ]}
    >
      {!!caption && (
        <Text
          style={{
            color: palette.textTertiary,
            fontSize: FONT_SIZE.xs,
            marginBottom: SPACING.sm,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {caption}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text
          style={{
            color: palette.text,
            fontFamily: FONT.mono,
            fontSize: FONT_SIZE.sm,
            lineHeight: FONT_SIZE.sm * 1.6,
          }}
        >
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

/* ----------------------------------------------------------------------
 * FormField + Input — minimal HF-styled input with label + hint.
 * -------------------------------------------------------------------- */

import { TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, hint, error, containerStyle, style, ...props }: InputProps) {
  const { palette } = useTheme();
  return (
    <View style={[{ marginBottom: SPACING.md }, containerStyle]}>
      {!!label && (
        <Text
          style={{
            color: palette.textSecondary,
            fontSize: FONT_SIZE.sm,
            fontWeight: '600',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={palette.textTertiary}
        style={[
          {
            backgroundColor: palette.surface,
            borderColor: error ? palette.red : palette.border,
            borderWidth: 1,
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.md,
            paddingVertical: 10,
            color: palette.text,
            fontSize: FONT_SIZE.base,
          },
          style,
        ]}
        {...props}
      />
      {!!error ? (
        <Text style={{ color: palette.red, fontSize: FONT_SIZE.xs, marginTop: 4 }}>{error}</Text>
      ) : !!hint ? (
        <Text style={{ color: palette.textTertiary, fontSize: FONT_SIZE.xs, marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/* ----------------------------------------------------------------------
 * EmptyState — friendly placeholder
 * -------------------------------------------------------------------- */

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, action, icon }: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
      }}
    >
      {!!icon && <View style={{ marginBottom: SPACING.md }}>{icon}</View>}
      <Text
        style={{
          color: palette.text,
          fontSize: FONT_SIZE.lg,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text
          style={{
            color: palette.textSecondary,
            fontSize: FONT_SIZE.sm,
            textAlign: 'center',
            marginTop: 6,
            maxWidth: 320,
          }}
        >
          {subtitle}
        </Text>
      )}
      {!!action && <View style={{ marginTop: SPACING.lg }}>{action}</View>}
    </View>
  );
}
