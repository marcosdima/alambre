import React from 'react';
import type { TextProps } from 'react-native';
import { Text as RNText, StyleSheet } from 'react-native';
import { useConfig } from '../providers/config';

export default function AppText({ style, ...props }: TextProps) {
  const { config } = useConfig();
  return <RNText allowFontScaling={false} {...props} style={[{ fontFamily: config.fontFamily }, styles.default, style]} />;
}

const styles = StyleSheet.create({
  default: {},
});
