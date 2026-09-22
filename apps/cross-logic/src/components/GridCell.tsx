import { useState, useRef, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { withTiming } from 'react-native-reanimated';
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

type VisibleIconState = {
  type: 'auto-cross' | 'cross' | 'tick';
  drawIt: boolean;
};

const CELL_ICON_ANIM_DURATION = 200;
const CELL_ICON_UNMOUNT_DELAY = 220;

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

  const [visibleIcon, setVisibleIcon] = useState<VisibleIconState | null>(() =>
    state !== 'empty' ? { type: state, drawIt: true } : null,
  );

  const prevPropState = useRef<CellState>(state);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevPropState.current !== state) {
    const prevState = prevPropState.current;
    prevPropState.current = state;

    if (state !== 'empty') {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setVisibleIcon({ type: state, drawIt: true });
    } else if (prevState !== 'empty') {
      // Transitioning to empty: keep departing icon mounted with drawIt={false} so it un-draws
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      exitTimerRef.current = setTimeout(() => {
        setVisibleIcon(null);
        exitTimerRef.current = null;
      }, CELL_ICON_UNMOUNT_DELAY);

      setVisibleIcon({ type: prevState, drawIt: false });
    }
  }

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const iconAnimation = useMemo(
    () => ({
      drawAnimation: (v: number) => withTiming(v, { duration: CELL_ICON_ANIM_DURATION }),
      resetAnimation: (v: number) => withTiming(v, { duration: CELL_ICON_ANIM_DURATION }),
    }),
    [],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'auto-cross'}
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
      {visibleIcon?.type === 'auto-cross' && (
        <View style={{ width: autoCrossSize, height: autoCrossSize, opacity: 0.4 }} pointerEvents="none">
          <AlambreIcons.Cross
            color={theme.color}
            lineWidth={2.5}
            drawIt={visibleIcon.drawIt}
            iconAnimation={iconAnimation}
          />
        </View>
      )}

      {visibleIcon?.type === 'cross' && (
        <View style={{ width: iconSize, height: iconSize }} pointerEvents="none">
          <AlambreIcons.Cross
            color={theme.danger}
            lineWidth={4}
            drawIt={visibleIcon.drawIt}
            iconAnimation={iconAnimation}
          />
        </View>
      )}

      {visibleIcon?.type === 'tick' && (
        <View style={{ width: iconSize, height: iconSize }} pointerEvents="none">
          <AlambreIcons.Tick
            color={theme.success}
            lineWidth={4}
            drawIt={visibleIcon.drawIt}
            iconAnimation={iconAnimation}
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
