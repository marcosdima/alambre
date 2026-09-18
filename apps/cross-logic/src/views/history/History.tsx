import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { AlambreIcons, useNavigator } from 'alambre';
import type { GameMode, CompletedRecord } from '../../domain/types';
import { useRecords } from '../../session/records-context';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { getPuzzleById } from '../../domain/puzzles/service';
import AppButton from '../../components/AppButton';

const formatTime = (totalSecs: number): string => {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
};

export default function History() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { records, getBestTime } = useRecords();
  const { startNewGame } = useGame();

  const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');

  const filteredRecords = useMemo(() => {
    const list = filterMode === 'all'
      ? [...records]
      : records.filter((r) => r.mode === filterMode);
    return list.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  }, [records, filterMode]);

  const handleReplay = (record: CompletedRecord) => {
    startNewGame(record.difficulty, record.mode, record.id);
    navigate('game');
  };

  if (records.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: theme.surfaceAlt }]}>
          <AlambreIcons.Trophy
            color={theme.muted}
            lineWidth={2}
            style={{ width: 44, height: 44 }}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.color }]}>
          {lang.history.emptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
          {lang.history.emptySubtitle}
        </Text>
        <AppButton onPress={() => navigate('gameSelect')}>
          <View style={styles.buttonInnerRow}>
            <AlambreIcons.Play
              color={theme.primary}
              lineWidth={2}
              style={{ width: 16, height: 16 }}
            />
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              {lang.history.playFirst}
            </Text>
          </View>
        </AppButton>
      </View>
    );
  }

  const zenCount = records.filter((r) => r.mode === 'zen').length;
  const challengeCount = records.filter((r) => r.mode === 'challenge').length;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.primary }]}>
            {records.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.totalCompleted}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.color }]}>
            {zenCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.zenMode}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.color }]}>
            {challengeCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.challengeMode}
          </Text>
        </View>
      </View>

      {/* Mode Filters */}
      <View style={styles.filterRow}>
        {(['all', 'zen', 'challenge'] as const).map((modeKey) => {
          const isSelected = filterMode === modeKey;
          const label =
            modeKey === 'all'
              ? 'Todos'
              : modeKey === 'zen'
                ? lang.history.zenMode
                : lang.history.challengeMode;
          return (
            <Pressable
              key={modeKey}
              onPress={() => setFilterMode(modeKey)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? theme.primary : theme.color,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Records List */}
      <View style={styles.recordsList}>
        {filteredRecords.map((record, index) => {
          const puzzle = getPuzzleById(record.id);
          const title = puzzle?.title ?? record.id;
          const bestTime = getBestTime(record.id, record.mode);
          const isBest = bestTime !== null && record.elapsedSeconds <= bestTime;
          const formattedDate = new Date(record.completedAt).toLocaleDateString();

          return (
            <View
              key={`${record.id}_${record.completedAt}_${index}`}
              style={[
                styles.recordCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.recordHeader}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.recordTitle, { color: theme.color }]} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={[styles.recordDate, { color: theme.muted }]}>
                    {formattedDate}
                  </Text>
                </View>

                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.modeBadge,
                      {
                        backgroundColor:
                          record.mode === 'challenge' ? theme.primarySoft : theme.surfaceAlt,
                        borderColor: record.mode === 'challenge' ? theme.warning : theme.border,
                      },
                    ]}
                  >
                    {record.mode === 'zen' ? (
                      <AlambreIcons.Leaf
                        color={theme.color}
                        lineWidth={2}
                        style={{ width: 12, height: 12 }}
                      />
                    ) : (
                      <AlambreIcons.Zap
                        color={theme.warning}
                        lineWidth={2}
                        style={{ width: 12, height: 12 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.modeBadgeText,
                        { color: record.mode === 'challenge' ? theme.warning : theme.color },
                      ]}
                    >
                      {record.mode === 'zen' ? lang.history.zenMode : lang.history.challengeMode}
                    </Text>
                  </View>

                  {isBest && (
                    <View style={[styles.recordBestBadge, { backgroundColor: theme.primarySoft }]}>
                      <AlambreIcons.Trophy
                        color={theme.primary}
                        lineWidth={2}
                        style={{ width: 11, height: 11 }}
                      />
                      <Text style={[styles.recordBestText, { color: theme.primary }]}>
                        {lang.history.bestTime}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.statsRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    {lang.history.recordTime}
                  </Text>
                  <Text style={[styles.statValue, { color: theme.color }]}>
                    {formatTime(record.elapsedSeconds)}
                  </Text>
                </View>

                {record.mode === 'challenge' && (
                  <View style={styles.statCol}>
                    <Text style={[styles.statLabel, { color: theme.muted }]}>
                      {lang.history.mistakes}
                    </Text>
                    <Text style={[styles.statValue, { color: theme.color }]}>
                      {record.mistakesCount}
                    </Text>
                  </View>
                )}

                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    {lang.home.selectDifficulty}
                  </Text>
                  <Text style={[styles.statValue, { color: theme.primary, textTransform: 'capitalize' }]}>
                    {record.difficulty}
                  </Text>
                </View>
              </View>

              {/* Replay Button */}
              <AppButton onPress={() => handleReplay(record)}>
                <View style={styles.buttonInnerRow}>
                  <AlambreIcons.Refresh
                    color={theme.primary}
                    lineWidth={2}
                    style={{ width: 14, height: 14 }}
                  />
                  <Text style={[styles.replayButtonText, { color: theme.primary }]}>
                    {lang.history.replay}
                  </Text>
                </View>
              </AppButton>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 12,
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordDate: {
    fontSize: 11,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  recordBestText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  replayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
