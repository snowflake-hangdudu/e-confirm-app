import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { colors, spacing } from '../theme';
import { formInputBoxed } from '../styles/form';
import { hasWebQaParam } from '../utils/webQuery';

export function LoginScreen() {
  const { login } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /** Demo 验收：仅 Web URL 带 qa= 时自动登录 */
  useEffect(() => {
    if (!hasWebQaParam()) return;
    login('admin', '123456');
  }, [login]);

  const onSubmit = () => {
    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    const ok = login(username.trim(), password);
    if (!ok) {
      setError('账号或密码错误');
      return;
    }
    setError('');
  };

  return (
    <ScreenBackground variant="login">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.shield}>
                <Text style={styles.shieldText}>e</Text>
              </View>
              <Text style={styles.brand}>e确镜</Text>
              <Text style={styles.sub}>手术部位安全确认 · 院内系统</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>医护人员登录</Text>
              <Text style={styles.label}>账号</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="请输入账号"
                placeholderTextColor={colors.muted}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  setError('');
                }}
              />
              <Text style={[styles.label, { marginTop: 14 }]}>密码</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="请输入密码"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError('');
                }}
                onSubmitEditing={onSubmit}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={styles.cta} onPress={onSubmit}>
                <Text style={styles.ctaText}>登录</Text>
              </Pressable>
            </View>

            <Text style={styles.footerHint}>仅限院内授权账号使用</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  shield: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shieldText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 1,
  },
  sub: { marginTop: 6, fontSize: 13, color: colors.muted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
  },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  input: formInputBoxed,
  error: {
    color: colors.danger,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footerHint: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    opacity: 0.85,
  },
});
