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
import { colors, radius, spacing } from '../theme';
import { formInputBoxed } from '../styles/form';
import { hasWebQaParam } from '../utils/webQuery';
import { BrandLogo } from '../components/BrandLogo';

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
              <BrandLogo size={64} />
              <Text style={styles.brand}>e确镜</Text>
              <Text style={styles.sub}>手术部位安全确认</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>医护人员登录</Text>
              <Text style={styles.label}>账号</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="请输入账号"
                placeholderTextColor={colors.weak}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  setError('');
                }}
              />
              <Text style={[styles.label, styles.labelGap]}>密码</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="请输入密码"
                placeholderTextColor={colors.weak}
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brand: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    shadowColor: 'rgb(24, 55, 80)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.label,
    marginBottom: 8,
  },
  labelGap: {
    marginTop: 18,
  },
  input: formInputBoxed,
  error: {
    color: colors.danger,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  cta: {
    marginTop: 24,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerHint: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.weak,
  },
});
