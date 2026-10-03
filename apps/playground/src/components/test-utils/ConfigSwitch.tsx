import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'alambre';
import AppTitle, { AppText } from '../AppTitle';

export interface ConfigSwitchProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

export function ConfigSwitch({ label, value, onChange }: ConfigSwitchProps) {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle" style={styles.label}>{label}</AppText>
      <View style={styles.buttonGroup}>
        <Button
          style={[styles.button, value ? styles.buttonActive : styles.buttonInactive]}
          onPress={() => onChange(true)}
        >
          <AppText variant="body" style={value ? styles.textActive : styles.textInactive}>On</AppText>
        </Button>
        <Button
          style={[styles.button, !value ? styles.buttonActive : styles.buttonInactive]}
          onPress={() => onChange(false)}
        >
          <AppText variant="body" style={!value ? styles.textActive : styles.textInactive}>Off</AppText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonInactive: {
    backgroundColor: 'transparent',
  },
  textActive: {
    color: '#000',
  },
  textInactive: {
    color: '#666',
  },
});
