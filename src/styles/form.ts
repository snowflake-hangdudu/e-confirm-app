import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

/** 网页端去掉原生 input 默认窄边框 */
const webInputReset: TextStyle =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
      } as unknown as TextStyle)
    : {};

export const formField: ViewStyle = {
  width: '100%',
  alignSelf: 'stretch',
  backgroundColor: colors.surface,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: colors.line,
};

export const formLabel: TextStyle = {
  fontSize: 12,
  color: colors.muted,
  marginBottom: 6,
};

export const formValue: TextStyle = {
  fontSize: 17,
  color: colors.ink,
  fontWeight: '600',
  width: '100%',
};

export const formInput: TextStyle = {
  width: '100%',
  alignSelf: 'stretch',
  borderWidth: 0,
  padding: 0,
  margin: 0,
  fontSize: 17,
  lineHeight: 24,
  minHeight: 28,
  color: colors.ink,
  backgroundColor: 'transparent',
  ...webInputReset,
};

export const formInputBoxed: TextStyle = {
  width: '100%',
  alignSelf: 'stretch',
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: colors.ink,
  backgroundColor: '#fff',
  ...webInputReset,
};
