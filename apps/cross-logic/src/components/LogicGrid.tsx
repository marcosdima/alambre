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

export default function LogicGrid({ puzzle, cellSize = 34 }: LogicGridProps) {
  const { theme } = useLightDark();
  const { grid, cellTapped } = useGame();

  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  const cats = puzzle.categories;
  const k = cats.length;

  // Row categories are C_0 .. C_{k-2}
  const rowCategories = cats.slice(0, k - 1);
  // Column categories are C_{k-1} .. C_1 (reversed)
  const colCategories = [...cats.slice(1)].reverse();

  const catBadgeWidth = 22;
  const itemLabelWidth = 54;
  const totalLeftHeaderWidth = catBadgeWidth + itemLabelWidth;
  const colHeaderHeight = 60;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalScroll}
    >
      <View style={styles.gridContainer}>
        {/* Top Header Row (Column Categories and Items) */}
        <View style={styles.headerRow}>
          {/* Top-left blank corner matching left labels */}
          <View style={{ width: totalLeftHeaderWidth, height: colHeaderHeight }} />

          {/* Column categories headers */}
          {colCategories.map((colCat, colCatIdx) => {
            const isLastColCategory = colCatIdx === colCategories.length - 1;

            return (
              <View
                key={colCat.id}
                style={[
                  styles.colCategoryBlock,
                  {
                    borderColor: theme.border,
                    borderRightWidth: isLastColCategory ? 0 : 2,
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
          const categoryHeight = rowCat.items.length * cellSize;

          return (
            <View
              key={rowCat.id}
              style={[
                styles.rowCategoryBlock,
                {
                  borderColor: theme.border,
                  borderBottomWidth: isLastRowCategory ? 0 : 2,
                },
              ]}
            >
              <View style={styles.rowCategoryRow}>
                {/* Category vertical badge spanning all items */}
                <View
                  style={[
                    styles.rowCatBadge,
                    {
                      width: catBadgeWidth,
                      height: categoryHeight,
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.rowCatVerticalText,
                      {
                        color: theme.primary,
                        transform: [{ rotate: '-90deg' }],
                        width: categoryHeight,
                      },
                    ]}
                  >
                    {rowCat.name}
                  </Text>
                </View>

                {/* Items and Subgrids Column */}
                <View style={styles.itemsAndSubgridsContainer}>
                  {rowCat.items.map((rowItem) => {
                    return (
                      <View key={rowItem.id} style={[styles.gridRow, { height: cellSize }]}>
                        {/* Row Item label */}
                        <View style={[styles.rowItemHeader, { width: itemLabelWidth, height: cellSize }]}>
                          <Text
                            numberOfLines={1}
                            style={[styles.rowItemText, { color: theme.color }]}
                          >
                            {rowItem.name}
                          </Text>
                        </View>

                        {/* Subgrid columns */}
                        {colCategories.map((colCat, colCatIdx) => {
                          const hasSubgrid = rowCatIdx + colCatIdx < k - 1;
                          const isLastColCategory = colCatIdx === colCategories.length - 1;

                          if (!hasSubgrid) {
                            // Stepped matrix: empty spacer block without borders
                            return (
                              <View
                                key={colCat.id}
                                style={{
                                  width: colCat.items.length * cellSize,
                                  height: cellSize,
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
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalScroll: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  colCategoryBlock: {
    flexDirection: 'column',
  },
  colCatTitleBox: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 2,
    marginHorizontal: 1,
  },
  colCatTitleText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colItemsRow: {
    flexDirection: 'row',
  },
  colItemHeader: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colItemText: {
    fontSize: 10,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  rowCategoryBlock: {
    flexDirection: 'column',
  },
  rowCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCatBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    overflow: 'hidden',
  },
  rowCatVerticalText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  itemsAndSubgridsContainer: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowItemHeader: {
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rowItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subgridRowBlock: {
    flexDirection: 'row',
  },
});
