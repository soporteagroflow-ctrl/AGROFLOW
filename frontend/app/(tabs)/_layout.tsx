import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

import { useTheme } from '../../src/ThemeContext';
import { RADIUS } from '../../src/theme';

function TabIcon({
  name,
  color,
  focused,
  activeBg,
}: {
  name: any;
  color: string;
  focused: boolean;
  activeBg: string;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.pill,
        backgroundColor: focused ? activeBg : 'transparent',
      }}
    >
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} activeBg={palette.accentSoft} />
          ),
        }}
      />
      <Tabs.Screen
        name="ganado"
        options={{
          title: 'Ganado',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="paw" color={color} focused={focused} activeBg={palette.accentSoft} />
          ),
        }}
      />
      <Tabs.Screen
        name="potreros"
        options={{
          title: 'Potreros',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="map" color={color} focused={focused} activeBg={palette.accentSoft} />
          ),
        }}
      />
      <Tabs.Screen
        name="finanzas"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cash" color={color} focused={focused} activeBg={palette.accentSoft} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} activeBg={palette.accentSoft} />
          ),
        }}
      />
    </Tabs>
  );
}
