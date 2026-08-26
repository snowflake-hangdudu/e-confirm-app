import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Variant = 'default' | 'login' | 'calm';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
};

const TINT: Record<Variant, { top: string; mid: string; blobA: string; blobB: string }> = {
  default: {
    top: '#E8EEF3',
    mid: '#F5F7F9',
    blobA: '#D5E3EE',
    blobB: '#DDE8E4',
  },
  login: {
    top: '#EAF1F6',
    mid: '#F5F7F9',
    blobA: '#D7E5EF',
    blobB: '#DEE8E5',
  },
  calm: {
    top: '#E7EEF2',
    mid: '#F5F7F9',
    blobA: '#D4E0E8',
    blobB: '#DCE6E2',
  },
};

/** 简单页面背景：色块分层 + 淡装饰圆（不依赖 gradient 原生模块） */
export function ScreenBackground({
  children,
  variant = 'default',
  style,
}: Props) {
  const tint = TINT[variant];

  return (
    <View style={[styles.root, { backgroundColor: tint.mid }, style]}>
      <View style={[styles.bandTop, { backgroundColor: tint.top }]} />
      <View style={[styles.blob, styles.blobTop, { backgroundColor: tint.blobA }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: tint.blobB }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  bandTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    opacity: 0.45,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.22,
    pointerEvents: 'none',
  },
  blobTop: {
    width: 220,
    height: 220,
    top: -70,
    right: -60,
  },
  blobBottom: {
    width: 260,
    height: 260,
    bottom: -90,
    left: -80,
  },
});
