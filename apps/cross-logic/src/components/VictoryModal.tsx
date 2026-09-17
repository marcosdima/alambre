import { Modal, StyleSheet, Text, View } from 'react-native';
import { useGame } from '../session/game-context';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import AppButton from './AppButton';

interface VictoryModalProps {
  onPlayAnother: () => void;
  onBackToMenu: () => void;
}

export default function VictoryModal({
  onPlayAnother,
  onBackToMenu,
}: VictoryModalProps) {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { isCompleted, isDefeated, elapsedSeconds, mistakesCount, activePuzzle } = useGame();

  const isVisible = isCompleted || isDefeated;
  if (!isVisible || !activePuzzle) return null;

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isVisible}
      onRequestClose={onBackToMenu}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Header Icon & Title */}
          <Text style={styles.emojiBadge}>
            {isCompleted ? '🎉' : '💔'}
          </Text>

          <Text style={[styles.title, { color: isCompleted ? theme.success : theme.danger }]}>
            {isCompleted ? lang.game.victoryTitle : lang.game.defeatTitle}
          </Text>

          <Text style={[styles.puzzleTitle, { color: theme.color }]}>
            {activePuzzle.title}
          </Text>

          <Text style={[styles.message, { color: theme.muted }]}>
            {isCompleted ? lang.game.victoryMessage : lang.game.defeatMessage}
          </Text>

          {/* Stats */}
          <View style={[styles.statsBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>
                {lang.game.time}
              </Text>
              <Text style={[styles.statValue, { color: theme.color }]}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>
                {lang.game.mistakes}
              </Text>
              <Text style={[styles.statValue, { color: theme.color }]}>
                {mistakesCount}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>
                {lang.home.selectDifficulty}
              </Text>
              <Text style={[styles.statValue, { color: theme.primary, textTransform: 'capitalize' }]}>
                {activePuzzle.difficulty}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <AppButton onPress={onPlayAnother}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                {lang.game.playAnother}
              </Text>
            </AppButton>

            <AppButton onPress={onBackToMenu}>
              <Text style={{ color: theme.muted, fontWeight: '600' }}>
                {lang.game.backToMenu}
              </Text>
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emojiBadge: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  puzzleTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
});
