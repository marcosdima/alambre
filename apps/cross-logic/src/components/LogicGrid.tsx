import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PuzzleDefinition } from '../domain/types';
import { createPairKey } from '../domain/grid-model';
import { useGame } from '../session/game-context';
import { useLightDark } from '../providers/theme';
import GridCell from './GridCell';

interface LogicGridProps {
  puzzle: PuzzleDefinition;
  cellSize?: number;
}

export default function LogicGrid({ puzzle, cellSize = 38 }: LogicGridProps) {
  const { theme } = useLightDark();
  const { grid, cellTapped } = useGame();

  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  const cats = puzzle.categories;
  const k = cats.length;

  const rowCategories = cats.slice(0, k - 1);
  const colCategories = cats.slice(1);

  const labelWidth = 72;
  const colHeaderHeight = 70;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.horizontalScroll}
    >
      <View style={styles.gridContainer}>
        {/* Top Header Row (Column Categories and Items) */}
        <View style={styles.headerRow}>
          {/* Top-left blank corner */}
          <View style={{ width: labelWidth, height: colHeaderHeight }} />

          {/* Column categories headers */}
          {colCategories.map((colCat, colCatIdx) => {
            return (
              <View
                key={colCat.id}
                style={[
                  styles.colCategoryBlock,
                  {
                    borderColor: theme.border,
                    borderRightWidth: colCatIdx === colCategories.length - 1 ? 0 : 2,
                  },
                ]}
              >
                {/* Category title */}
                <View style={[styles.colCatTitleBox, { backgroundColor: theme.surfaceAlt }]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.colCatTitleText, { color: theme.primary }]}
                  >
                    {colCat.name}
                  </Text>
                </View>

                {/* Item labels */}
                <View style={styles.colItemsRow}>
                  {colCat.items.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.colItemHeader, { width: cellSize }]}
                    >
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                          styles.colItemText,
                          { color: theme.color, transform: [{ rotate: '-45deg' }] },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Row categories and cells */}
        {rowCategories.map((rowCat, rowCatIdx) => {
          const isLastRowCategory = rowCatIdx === rowCategories.length - 1;

          return (
            <View
              key={rowCat.id}
              style={[
                styles.rowCategoryBlock,
                {
                  borderColor: theme.border,
                  borderBottomWidth: isLastRowCategory ? 1 : 2,
                },
              ]}
            >
              {rowCat.items.map((rowItem, rowItemIdx) => {
                const isFirstItemOfCategory = rowItemIdx === 0;

                return (
                  <View key={rowItem.id} style={styles.gridRow}>
                    {/* Row Item label */}
                    <View style={[styles.rowItemHeader, { width: labelWidth }]}>
                      {isFirstItemOfCategory && (
                        <Text
                          numberOfLines={1}
                          style={[styles.rowCatLabel, { color: theme.primary }]}
                        >
                          {rowCat.name}
                        </Text>
                      )}
                      <Text
                        numberOfLines={1}
                        style={[styles.rowItemText, { color: theme.color }]}
                      >
                        {rowItem.name}
                      </Text>
                    </View>

                    {/* Subgrids columns */}
                    {colCategories.map((colCat, colCatIdx) => {
                      const actualColCatIdx = colCatIdx + 1;
                      const hasSubgrid = rowCatIdx < actualColCatIdx;
                      const isLastColCategory = colCatIdx === colCategories.length - 1;

                      if (!hasSubgrid) {
                        // Empty spacer block
                        return (
                          <View
                            key={colCat.id}
                            style={{
                              width: colCat.items.length * cellSize,
                              height: cellSize,
                              backgroundColor: theme.surfaceAlt,
                              opacity: 0.25,
                              borderRightWidth: isLastColCategory ? 0 : 2,
                              borderColor: theme.border,
                            }}
                          />
                        );
                      }

                      return (
                        <View
                          key={colCat.id}
                          style={[
                            styles.subgridRowBlock,
                            {
                              borderColor: theme.border,
                              borderRightWidth: isLastColCategory ? 0 : 2,
                            },
                          ]}
                        >
                          {colCat.items.map((colItem) => {
                            const pairKey = createPairKey(
                              rowCat.id,
                              rowItem.id,
                              colCat.id,
                              colItem.id,
                            );
                            const cellState = grid[pairKey] ?? 'empty';
                            const isHighlighted = activeCellKey === pairKey;

                            return (
                              <GridCell
                                key={colItem.id}
                                state={cellState}
                                size={cellSize}
                                isHighlighted={isHighlighted}
                                onPress={() => {
                                  setActiveCellKey(pairKey);
                                  cellTapped(rowCat.id, rowItem.id, colCat.id, colItem.id);
                                }}
                                accessibilityLabel={`${rowItem.name}, ${colItem.name}: ${cellState}`}
                              />
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalScroll: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  gridContainer: {
    alignSelf: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  colCategoryBlock: {
    flexDirection: 'column',
  },
  colCatTitleBox: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  colCatTitleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  colItemsRow: {
    flexDirection: 'row',
  },
  colItemHeader: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colItemText: {
    fontSize: 11,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
  },
  rowCategoryBlock: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowItemHeader: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 38,
  },
  rowCatLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rowItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subgridRowBlock: {
    flexDirection: 'row',
  },
});
