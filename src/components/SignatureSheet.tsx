import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SignaturePad } from './SignaturePad';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  title?: string;
  signerName?: string;
  /** @deprecated 使用 signerName */
  familyName?: string;
  initialPaths: string[];
  onCancel: () => void;
  onConfirm: (paths: string[]) => void;
};

/**
 * 签字层：原生用 Modal；遮罩用上方空白区承接点击，避免 absoluteFill 抢走签字触控。
 */
export function SignatureSheet({
  visible,
  title = '请签字',
  signerName,
  familyName,
  initialPaths,
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState<string[]>([]);
  const name = signerName ?? familyName ?? '';

  useEffect(() => {
    if (visible) setPaths(initialPaths);
  }, [visible, initialPaths]);

  const sheet = (
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 12) + spacing.md },
      ]}
      collapsable={false}
    >
      <View style={styles.handle} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>
        {name ? `${name}，请在下面签字` : '请在下面签字'}
      </Text>

      <SignaturePad paths={paths} onChange={setPaths} height={220} />

      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={() => setPaths([])}>
          <Text style={styles.secondaryText}>重写</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={onCancel}>
          <Text style={styles.ghostText}>取消</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, paths.length === 0 && styles.disabled]}
          disabled={paths.length === 0}
          onPress={() => onConfirm(paths)}
        >
          <Text style={styles.primaryText}>确认</Text>
        </Pressable>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={styles.mask} pointerEvents="box-none">
        <Pressable style={styles.backdropFlex} onPress={onCancel} />
        {sheet}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.mask}>
        <Pressable style={styles.backdropFlex} onPress={onCancel} />
        {sheet}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 32, 0.45)',
    ...(Platform.OS === 'web' ? (StyleSheet.absoluteFill as object) : null),
    zIndex: 50,
  },
  /** 只占弹层上方空白，不盖住底部签字板 */
  backdropFlex: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.line,
    elevation: 8,
    zIndex: 2,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  sub: { marginTop: 4, marginBottom: 12, fontSize: 13, color: colors.muted },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryText: { color: colors.ink, fontWeight: '700' },
  ghost: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  ghostText: { color: colors.primary, fontWeight: '700' },
  primary: {
    flex: 1.3,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
