import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigator } from 'alambre';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import LogicGrid from '../../components/LogicGrid';
import CluesList from '../../components/CluesList';
import GameControls from '../../components/GameControls';
import VictoryModal from '../../components/VictoryModal';
import AppButton from '../../components/AppButton';

export default function GameScreen() {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const { activePuzzle, startNewGame, difficulty, mode } = useGame();

  if (!activePuzzle) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.muted }]}>
          No hay partida activa seleccionada.
        </Text>
        <AppButton onPress={() => navigate('home')}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>
            Ir al inicio
          </Text>
        </AppButton>
      </View>
    );
  }

  const handlePlayAnother = () => {
    startNewGame(difficulty, mode);
  };

  const handleBackToMenu = () => {
    navigate('home');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.color }]}>
            {activePuzzle.title}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: theme.primarySoft, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.difficultyText, { color: theme.primary }]}>
              {activePuzzle.difficulty}
            </Text>
          </View>
        </View>

        {/* Game Controls & Status Bar */}
        <GameControls />

        {/* Logic Grid Component */}
        <View style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LogicGrid puzzle={activePuzzle} />
        </View>

        {/* Clues & Story */}
        <CluesList story={activePuzzle.story} clues={activePuzzle.clues} />
      </ScrollView>

      {/* Victory / Defeat Modal */}
      <VictoryModal
        onPlayAnother={handlePlayAnother}
        onBackToMenu={handleBackToMenu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gridCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
