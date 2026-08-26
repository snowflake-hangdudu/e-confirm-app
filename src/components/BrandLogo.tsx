import React from 'react';
import { Image, StyleSheet } from 'react-native';

type Props = {
  size?: number;
};

/** 页内使用圆角透明底定稿图标 */
export function BrandLogo({ size = 64 }: Props) {
  return (
    <Image
      source={require('../../assets/brand-icon.png')}
      style={[styles.logo, { width: size, height: size }]}
      accessibilityLabel="e确镜"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
  },
});
