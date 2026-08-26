import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { ConfirmSiteScreen } from '../screens/ConfirmSiteScreen';
import { ConfirmStackParamList } from '../types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ConfirmStackParamList>();

export function ConfirmStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#EEF5FA' },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfirmSite"
        component={ConfirmSiteScreen}
        options={{ title: '选择手术部位' }}
      />
    </Stack.Navigator>
  );
}
