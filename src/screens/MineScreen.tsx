import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarMetrics } from '../navigation/tabBarLayout';
import { useSession } from '../context/SessionContext';
import { colors, radius } from '../theme';
import { MainTabParamList } from '../types';
import { showAlert } from '../utils/showAlert';
import { BrandLogo } from '../components/BrandLogo';

type Props = BottomTabScreenProps<MainTabParamList, 'Mine'>;

export function MineScreen(_props: Props) {
  const { logout, staffUsername, session } = useSession();
  const insets = useSafeAreaInsets();
  const tab = getTabBarMetrics(insets.bottom);

  const onLogout = () => {
    showAlert('退出登录？', '当前未完成的填写会清空，需要重新登录。', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.brandBlock}>
            <BrandLogo size={72} />
            <Text style={styles.brand}>e确镜</Text>
            <Text style={styles.slogan}>我的手术，我确认</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.scroll,
          tab.overlay ? { paddingBottom: 32 + tab.height } : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>账号信息</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.k}>当前登录</Text>
            <Text style={styles.v}>{staffUsername || '—'}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.k}>核对护士</Text>
            <Text style={styles.v}>{session.nurseName || '—'}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutPressed]}
          onPress={onLogout}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>

        <Text style={styles.version}>e确镜 · V1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
  },
  brandBlock: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  brand: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
  },
  slogan: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  k: {
    fontSize: 14,
    color: colors.muted,
  },
  v: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  logoutBtn: {
    marginTop: 24,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.tab,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E7ED',
  },
  logoutPressed: {
    backgroundColor: colors.dangerSoft,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '500',
  },
  version: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 12,
    color: colors.weak,
  },
});
