import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useConfirm } from 'alambre';
import { useGame } from '../session/game-context';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';

export default function GameControls() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { confirm } = useConfirm();
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    resetGrid,
    elapsedSeconds,
    mistakesCount,
    mode,
  } = useGame();

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = async () => {
    const accepted = await confirm({
      title: lang.game.resetConfirmTitle,
      message: lang.game.resetConfirmMessage,
      confirmLabel: lang.common.restart,
      cancelLabel: lang.common.cancel,
      tone: 'danger',
    });
    if (accepted) {
      resetGrid();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {/* Status Badges (Time & Mistakes) */}
      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.badgeLabel, { color: theme.muted }]}>
            {lang.game.time}
          </Text>
          <Text style={[styles.badgeValue, { color: theme.color }]}>
            ⏱ {formatTime(elapsedSeconds)}
          </Text>
        </View>

        {mode === 'challenge' && (
          <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.badgeLabel, { color: theme.muted }]}>
              {lang.game.mistakes}
            </Text>
            <Text style={[styles.badgeValue, { color: mistakesCount > 0 ? theme.danger : theme.color }]}>
              {mistakesCount === 0 && '❤️❤️❤️'}
              {mistakesCount === 1 && '❤️❤️🖤'}
              {mistakesCount === 2 && '❤️🖤🖤'}
              {mistakesCount >= 3 && '🖤🖤🖤'}
            </Text>
          </View>
        )}

        {mode === 'zen' && (
          <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.badgeValue, { color: theme.primary, fontSize: 12 }]}>
              🌱 Zen
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons: Undo, Redo, Reset */}
      <View style={styles.buttonsRow}>
        <Pressable
          onPress={undo}
          disabled={!canUndo}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: canUndo ? (pressed ? 0.75 : 1) : 0.4,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.undo}
        >
          <Text style={[styles.actionButtonText, { color: theme.color }]}>
            ↩ {lang.game.undo}
          </Text>
        </Pressable>

        <Pressable
          onPress={redo}
          disabled={!canRedo}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: canRedo ? (pressed ? 0.75 : 1) : 0.4,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.redo}
        >
          <Text style={[styles.actionButtonText, { color: theme.color }]}>
            ↪ {lang.game.redo}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.reset}
        >
          <Text style={[styles.actionButtonText, { color: theme.danger }]}>
            🔄 {lang.game.reset}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
