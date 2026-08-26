import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/** 全应用同一套 Ionicons，避免 Tab / 首页再用字符图标 */
export const appIcons = {
  confirm: {
    on: 'shield-checkmark' as const,
    off: 'shield-checkmark-outline' as const,
  },
  mine: {
    on: 'person-circle' as const,
    off: 'person-circle-outline' as const,
  },
  patient: 'person' as const,
  family: 'people' as const,
  check: 'checkmark-circle' as const,
};

type AppIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color: string;
};

export function AppIcon({ name, size = 22, color }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
