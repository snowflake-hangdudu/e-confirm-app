import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { SessionProvider, useSession } from './src/context/SessionContext';
import { MainTabs } from './src/navigation/MainTabs';
import { LoginScreen } from './src/screens/LoginScreen';
import { PhoneShell } from './src/components/PhoneShell';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  const root = document.getElementById('root');
  if (root) {
    root.style.height = '100%';
    root.style.display = 'flex';
  }
}

function RootNavigator() {
  const { isLoggedIn } = useSession();
  if (!isLoggedIn) return <LoginScreen />;
  return <MainTabs />;
}

function AppShell() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          SplashScreen.setOptions({ duration: 200, fade: true });
        }
      } catch {
        // ignore
      }
      if (cancelled) return;
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PhoneShell>
      <View style={styles.fill}>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </View>
    </PhoneShell>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: '#EEF5FA',
  },
});
