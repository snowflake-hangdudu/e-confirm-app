import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { colors, spacing } from '../theme';
import { MainTabParamList } from '../types';
import { showAlert } from '../utils/showAlert';

type Props = BottomTabScreenProps<MainTabParamList, 'Mine'>;

export function MineScreen(_props: Props) {
  const { logout, staffUsername, session } = useSession();

  const onLogout = () => {
    showAlert('退出登录？', '当前未完成的填写会清空，需要重新登录。', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScreenBackground variant="login">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.brandBlock}>
            <View style={styles.shield}>
              <Text style={styles.shieldText}>e</Text>
            </View>
            <Text style={styles.brand}>e确镜</Text>
            <Text style={styles.slogan}>我的手术，我确认</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>账号信息</Text>
            <View style={styles.row}>
              <Text style={styles.k}>当前登录</Text>
              <Text style={styles.v}>{staffUsername || '—'}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.k}>核对护士</Text>
              <Text style={styles.v}>{session.nurseName || '—'}</Text>
            </View>
          </View>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  brandBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  shield: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  shieldText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  brand: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: 1 },
  slogan: { fontSize: 14, color: colors.muted, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  k: { fontSize: 14, color: colors.muted },
  v: { fontSize: 15, fontWeight: '600', color: colors.ink },
  logoutBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
});
