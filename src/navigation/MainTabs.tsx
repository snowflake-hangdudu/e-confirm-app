import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmStack } from './ConfirmStack';
import { getTabBarMetrics } from './tabBarLayout';
import { MineScreen } from '../screens/MineScreen';
import { MainTabParamList } from '../types';
import { colors } from '../theme';
import { AppIcon, appIcons } from '../components/AppIcon';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const tab = getTabBarMetrics(insets.bottom);
  const tabBarStyle = {
    ...styles.tabBar,
    height: tab.height,
    paddingBottom: tab.bottomPad,
    ...(tab.overlay
      ? {
          position: 'absolute' as const,
          left: 0,
          right: 0,
          bottom: 0,
        }
      : { position: 'relative' as const, bottom: 'auto' as const }),
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
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: false,
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
            tabBarStyle: hideTab
              ? { ...tabBarStyle, display: 'none' }
              : tabBarStyle,
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
    borderTopColor: colors.tabLine,
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
  },
  tabItem: {
    paddingTop: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
