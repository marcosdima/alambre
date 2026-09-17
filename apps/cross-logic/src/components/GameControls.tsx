import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlambreIcons, useConfirm } from 'alambre';
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
      {/* Status Indicators */}
      <View style={styles.statusRow}>
        {/* Timer */}
        <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AlambreIcons.Watch
            color={theme.muted}
            lineWidth={2}
            style={{ width: 14, height: 14 }}
          />
          <Text style={[styles.badgeValue, { color: theme.color }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>

        {/* Mode / Mistakes */}
        {mode === 'challenge' ? (
          <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.heartsRow}>
              {[0, 1, 2].map((idx) => {
                const lost = idx < mistakesCount;
                return (
                  <AlambreIcons.Heart
                    key={idx}
                    color={lost ? theme.border : theme.danger}
                    fill={lost ? 'none' : theme.danger}
                    lineWidth={2}
                    style={{ width: 15, height: 15 }}
                  />
                );
              })}
            </View>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AlambreIcons.Leaf
              color={theme.primary}
              lineWidth={2}
              style={{ width: 14, height: 14 }}
            />
            <Text style={[styles.badgeValue, { color: theme.primary }]}>
              {lang.home.zenMode}
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
              opacity: canUndo ? (pressed ? 0.75 : 1) : 0.35,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.undo}
        >
          <AlambreIcons.Undo
            color={theme.color}
            lineWidth={2.5}
            style={{ width: 14, height: 14 }}
          />
          <Text style={[styles.actionButtonText, { color: theme.color }]}>
            {lang.game.undo}
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
              opacity: canRedo ? (pressed ? 0.75 : 1) : 0.35,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.redo}
        >
          <AlambreIcons.Redo
            color={theme.color}
            lineWidth={2.5}
            style={{ width: 14, height: 14 }}
          />
          <Text style={[styles.actionButtonText, { color: theme.color }]}>
            {lang.game.redo}
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
          <AlambreIcons.Refresh
            color={theme.danger}
            lineWidth={2.5}
            style={{ width: 14, height: 14 }}
          />
          <Text style={[styles.actionButtonText, { color: theme.danger }]}>
            {lang.game.reset}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  badgeValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
