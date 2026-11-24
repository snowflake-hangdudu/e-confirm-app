import React from 'react';
import { Image, StyleSheet } from 'react-native';

type Props = {
  size?: number;
};

/** 页内品牌图标：与启动页同源满铺蓝底资源，避免圆角透明底白边 */
export function BrandLogo({ size = 64 }: Props) {
  return (
    <Image
      source={require('../../assets/brand-icon.png')}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }]}
      accessibilityLabel="e确镜"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
    overflow: 'hidden',
  },
});
