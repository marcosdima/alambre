import type { ButtonProps } from 'alambre';
import { Button } from 'alambre';
import { View, StyleSheet } from 'react-native';
import { useLightDark } from '../providers/theme';

export default function AppButton({ style, children, ...props }: ButtonProps) {
  const { theme } = useLightDark();

  return (
    <Button {...props} style={style}>
      {({ pressed, disabled, loading }) => (
        <View
          style={[
            styles.shell,
            { borderColor: theme.primary, backgroundColor: pressed ? theme.surfaceAlt : theme.surface },
            (disabled || loading) && styles.muted,
          ]}
        >
          {typeof children === 'function'
            ? children({ pressed, disabled, loading })
            : children}
        </View>
      )}
    </Button>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  muted: {
    opacity: 0.5,
  },
});
