import { Pressable, StyleSheet, View } from 'react-native';
import { AlambreIcons } from 'alambre';
import type { CellState } from '../domain/types';
import { useLightDark } from '../providers/theme';

interface GridCellProps {
  state: CellState;
  size?: number;
  isHighlighted?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function GridCell({
  state,
  size = 38,
  isHighlighted = false,
  onPress,
  accessibilityLabel,
}: GridCellProps) {
  const { theme } = useLightDark();

  const iconSize = Math.max(16, Math.floor(size * 0.72));
  const autoCrossSize = Math.max(14, Math.floor(size * 0.58));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          borderColor: theme.border,
          backgroundColor: isHighlighted ? theme.primarySoft : theme.surface,
        },
        pressed && styles.cellPressed,
      ]}
    >
      {state === 'auto-cross' && (
        <View style={{ width: autoCrossSize, height: autoCrossSize, opacity: 0.4 }}>
          <AlambreIcons.Cross
            color={theme.color}
            lineWidth={2.5}
            drawIt={true}
          />
        </View>
      )}

      {state === 'cross' && (
        <View style={{ width: iconSize, height: iconSize }}>
          <AlambreIcons.Cross
            color={theme.danger}
            lineWidth={4}
            drawIt={true}
          />
        </View>
      )}

      {state === 'tick' && (
        <View style={{ width: iconSize, height: iconSize }}>
          <AlambreIcons.Tick
            color={theme.success}
            lineWidth={4}
            drawIt={true}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  cellPressed: {
    opacity: 0.75,
  },
});
