import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AlambreIcons, useNavigator } from 'alambre';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import LogicGrid from '../../components/LogicGrid';
import CluesList from '../../components/CluesList';
import GameControls from '../../components/GameControls';
import VictoryModal from '../../components/VictoryModal';
import AppButton from '../../components/AppButton';

export default function GameScreen() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const {
    activePuzzle,
    startNewGame,
    difficulty,
    mode,
    strikethroughClues,
  } = useGame();

  const [cluesExpanded, setCluesExpanded] = useState(true);

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

  const diffLabel =
    (lang.home as Record<string, string>)[activePuzzle.difficulty] ??
    activePuzzle.difficulty;

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
          <Text style={[styles.title, { color: theme.color }]} numberOfLines={1}>
            {activePuzzle.title}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: theme.primarySoft, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.difficultyText, { color: theme.primary }]}>
              {diffLabel}
            </Text>
          </View>
        </View>

        {/* Game Controls & Status Bar */}
        <GameControls />

        {/* Logic Grid Component */}
        <View style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LogicGrid puzzle={activePuzzle} />
        </View>

        {/* Retractable Clues Header & Toggle */}
        <Pressable
          onPress={() => setCluesExpanded((prev) => !prev)}
          style={({ pressed }) => [
            styles.cluesToggleBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={lang.game.cluesTitle}
        >
          <View style={styles.cluesToggleLeft}>
            <AlambreIcons.Book
              color={theme.primary}
              lineWidth={2}
              style={{ width: 16, height: 16 }}
            />
            <Text style={[styles.cluesToggleTitle, { color: theme.color }]}>
              {lang.game.cluesTitle}
            </Text>
            <View style={[styles.cluesCountBadge, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.cluesCountText, { color: theme.primary }]}>
                {strikethroughClues.length}/{activePuzzle.clues.length}
              </Text>
            </View>
          </View>

          <AlambreIcons.Arrow
            color={theme.muted}
            lineWidth={2}
            rotation={cluesExpanded ? 90 : 270}
            style={{ width: 14, height: 14 }}
          />
        </Pressable>

        {/* Clues & Story Content */}
        {cluesExpanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
          >
            <CluesList story={activePuzzle.story} clues={activePuzzle.clues} />
          </Animated.View>
        )}
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
    padding: 12,
    gap: 10,
    paddingBottom: 30,
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
    marginTop: 2,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  difficultyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gridCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cluesToggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cluesToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cluesToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cluesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cluesCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
