import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmStack } from './ConfirmStack';
import { MineScreen } from '../screens/MineScreen';
import { MainTabParamList } from '../types';
import { colors } from '../theme';
import { AppIcon, appIcons } from '../components/AppIcon';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8);
  const tabBarStyle = {
    ...styles.tabBar,
    height: Platform.OS === 'web' ? 64 : 50 + bottomPad,
    paddingBottom: bottomPad,
    ...(Platform.OS === 'web'
      ? { position: 'relative' as const, bottom: 'auto' as const }
      : null),
  };

  return (
    <Tab.Navigator
      safeAreaInsets={
        Platform.OS === 'web'
          ? { top: 0, right: 0, bottom: 0, left: 0 }
          : undefined
      }
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="ConfirmFlow"
        component={ConfirmStack}
        options={({ route }) => {
          const step = getFocusedRouteNameFromRoute(route) ?? 'Welcome';
          const hideTab = step !== 'Welcome';
          return {
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabLabel, { color }]}>确认</Text>
            ),
            tabBarIcon: ({ focused, color }) => (
              <AppIcon
                name={focused ? appIcons.confirm.on : appIcons.confirm.off}
                size={22}
                color={color}
              />
            ),
            tabBarStyle: hideTab ? { display: 'none' } : tabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Mine"
        component={MineScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>我的</Text>
          ),
          tabBarIcon: ({ focused, color }) => (
            <AppIcon
              name={focused ? appIcons.mine.on : appIcons.mine.off}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  tabItem: {
    paddingTop: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 1,
    marginBottom: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
