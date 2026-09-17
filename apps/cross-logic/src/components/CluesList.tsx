import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Clue } from '../domain/types';
import { useGame } from '../session/game-context';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';

interface CluesListProps {
  story?: string;
  clues: Clue[];
}

export default function CluesList({ story, clues }: CluesListProps) {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { strikethroughClues, toggleClueStrikethrough } = useGame();

  return (
    <View style={styles.container}>
      {story ? (
        <View
          style={[
            styles.storyCard,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.storyText, { color: theme.color }]}>
            {story}
          </Text>
        </View>
      ) : null}

      <View style={styles.cluesHeader}>
        <Text style={[styles.cluesTitle, { color: theme.color }]}>
          {lang.game.cluesTitle}
        </Text>
        <Text style={[styles.cluesSubtitle, { color: theme.muted }]}>
          {lang.game.cluesSubtitle}
        </Text>
      </View>

      <View style={styles.cluesList}>
        {clues.map((clue, index) => {
          const isStruck = strikethroughClues.includes(clue.id);

          return (
            <Pressable
              key={clue.id}
              onPress={() => toggleClueStrikethrough(clue.id)}
              style={({ pressed }) => [
                styles.clueItem,
                {
                  backgroundColor: isStruck ? theme.surfaceAlt : theme.surface,
                  borderColor: isStruck ? theme.border : theme.primarySoft,
                },
                pressed && styles.cluePressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isStruck }}
            >
              <View
                style={[
                  styles.clueNumberBadge,
                  {
                    backgroundColor: isStruck ? theme.border : theme.primarySoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.clueNumberText,
                    { color: isStruck ? theme.muted : theme.primary },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <Text
                style={[
                  styles.clueText,
                  {
                    color: isStruck ? theme.muted : theme.color,
                    textDecorationLine: isStruck ? 'line-through' : 'none',
                    opacity: isStruck ? 0.6 : 1,
                  },
                ]}
              >
                {clue.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  storyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cluesHeader: {
    gap: 2,
  },
  cluesTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cluesSubtitle: {
    fontSize: 12,
  },
  cluesList: {
    gap: 8,
  },
  clueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  cluePressed: {
    opacity: 0.8,
  },
  clueNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clueNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
