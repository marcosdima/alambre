import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export default function AppText({ style, ...props }: TextProps) {
  return <RNText {...props} style={[styles.default, style]} />;
}

const styles = StyleSheet.create({
  default: {
    // We will set a custom font here later.
    // fontFamily: 'System', 
  }
});
