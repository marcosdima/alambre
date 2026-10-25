import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'alambre';
import { AppText, useTheme } from 'alambre/ui';

export interface ConfigSwitchProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
  testID?: string;
}

export function ConfigSwitch({ label, value, onChange, testID }: ConfigSwitchProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="subtitle" style={styles.label}>{label}</AppText>
      <View
        style={[
          styles.buttonGroup,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Button
          testID={testID ? `${testID}-on` : undefined}
          accessibilityLabel={`${label} On`}
          style={[
            styles.button,
            value
              ? [styles.buttonActive, { backgroundColor: theme.primary }]
              : styles.buttonInactive,
          ]}
          onPress={() => onChange(true)}
        >
          <AppText
            variant="body"
            weight={value ? 'bold' : 'normal'}
            style={{ color: value ? theme.onPrimary : theme.muted, fontSize: 12 }}
          >
            On
          </AppText>
        </Button>
        <Button
          testID={testID ? `${testID}-off` : undefined}
          accessibilityLabel={`${label} Off`}
          style={[
            styles.button,
            !value
              ? [styles.buttonActive, { backgroundColor: theme.surface }]
              : styles.buttonInactive,
          ]}
          onPress={() => onChange(false)}
        >
          <AppText
            variant="body"
            weight={!value ? 'bold' : 'normal'}
            style={{ color: !value ? theme.color : theme.muted, fontSize: 12 }}
          >
            Off
          </AppText>
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
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  buttonActive: {
    elevation: 1,
  },
  buttonInactive: {
    backgroundColor: 'transparent',
  },
});
