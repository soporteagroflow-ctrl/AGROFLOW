import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useToastStore, ToastType } from './store';
import { useTheme } from './ThemeContext';
import { FONT_SIZE, RADIUS, SPACING, SHADOW } from './theme';

const ICONS: Record<ToastType, { name: any; key: string }> = {
  success: { name: 'checkmark-circle', key: 'green' },
  error: { name: 'alert-circle', key: 'red' },
  warning: { name: 'warning', key: 'orange' },
  info: { name: 'information-circle', key: 'accent' },
};

export function ToastContainer() {
  const { palette } = useTheme();
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => {
        const icon = ICONS[toast.type];
        const color = palette[icon.key as keyof typeof palette] as string;
        const softKey = `${icon.key}Soft` as keyof typeof palette;
        const bg = palette[softKey] as string || palette.surface;

        return (
          <Pressable
            key={toast.id}
            onPress={() => dismiss(toast.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: color,
              borderLeftWidth: 4,
              borderLeftColor: color,
              borderRadius: RADIUS.md,
              paddingVertical: 12,
              paddingHorizontal: SPACING.md,
              marginBottom: SPACING.sm,
              minWidth: 300,
              maxWidth: 500,
              ...SHADOW.md,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: bg,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: SPACING.sm,
              }}
            >
              <Ionicons name={icon.name} size={16} color={color} />
            </View>
            <Text
              style={{
                flex: 1,
                color: palette.text,
                fontSize: FONT_SIZE.sm,
                fontWeight: '600',
                lineHeight: FONT_SIZE.sm * 1.4,
              }}
              numberOfLines={3}
            >
              {toast.message}
            </Text>
            <Ionicons
              name="close"
              size={16}
              color={palette.textTertiary}
              style={{ marginLeft: SPACING.sm }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
