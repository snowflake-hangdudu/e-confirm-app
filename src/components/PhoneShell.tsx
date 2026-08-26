import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../theme';

/** 竖屏手机参考比例（宽/高） */
const PHONE_ASPECT = 414 / 896;
const MIN_W = 320;
const MAX_W = 430;

type Props = { children: React.ReactNode };

/**
 * Web：按浏览器窗口自适应手机竖屏画幅（不再固定 896 高再缩放）
 * 真机：全屏
 */
export function PhoneShell({ children }: Props) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const availW = Math.max(280, width - 32);
  const availH = Math.max(420, height - 56);

  // 先按高度吃满，再被宽度/比例夹住
  let frameH = availH;
  let frameW = frameH * PHONE_ASPECT;
  if (frameW > availW) {
    frameW = availW;
    frameH = frameW / PHONE_ASPECT;
  }
  frameW = Math.min(MAX_W, Math.max(MIN_W, frameW));
  frameH = frameW / PHONE_ASPECT;
  if (frameH > availH) {
    frameH = availH;
    frameW = frameH * PHONE_ASPECT;
  }

  frameW = Math.round(frameW);
  frameH = Math.round(frameH);
  const bezelPad = 8;

  return (
    <View style={styles.desk}>
      <Text style={styles.caption}>
        手机竖屏预览 · 自适应 {frameW}×{frameH}
      </Text>
      <View
        style={[
          styles.bezel,
          {
            width: frameW + bezelPad * 2,
            height: frameH + bezelPad * 2,
          },
        ]}
      >
        <View style={[styles.notchBar, { width: frameW * 0.35 }]} />
        <View style={[styles.screen, { width: frameW, height: frameH }]}>
          <View style={styles.fill}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1E2933',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  caption: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  bezel: {
    backgroundColor: '#0B1218',
    borderRadius: 36,
    padding: 8,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  notchBar: {
    position: 'absolute',
    top: 14,
    zIndex: 2,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A3540',
    pointerEvents: 'none',
  },
  screen: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
  },
});
