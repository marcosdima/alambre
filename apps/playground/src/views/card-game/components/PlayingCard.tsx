import React, { memo } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Rect, G, Circle } from 'react-native-svg';
import type { Rank, Suit } from '../types';

export interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
  faceUp?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  elevation?: number;
  accessible?: boolean;
}

const SIZE_CONFIGS = {
  sm: { width: 54, height: 78, radius: 6, fontSize: 11, suitSize: 10, centerSize: 22 },
  md: { width: 76, height: 110, radius: 9, fontSize: 14, suitSize: 13, centerSize: 32 },
  lg: { width: 98, height: 142, radius: 12, fontSize: 18, suitSize: 16, centerSize: 42 },
};

export const PlayingCard = memo(function PlayingCard({
  suit,
  rank,
  faceUp = true,
  selected = false,
  size = 'md',
  style,
  accessible = true,
}: PlayingCardProps) {
  const config = SIZE_CONFIGS[size];
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitColor = isRed ? '#E02424' : '#1A1C23';

  if (!faceUp) {
    return (
      <View
        accessible={accessible}
        accessibilityLabel={accessible ? 'Playing card, face down' : undefined}
        style={[
          styles.cardBase,
          {
            width: config.width,
            height: config.height,
            borderRadius: config.radius,
            borderColor: selected ? '#6366F1' : '#CBD5E1',
            borderWidth: selected ? 2 : 1,
          },
          styles.cardBackContainer,
          style,
        ]}
      >
        <CardBackPattern width={config.width} height={config.height} radius={config.radius} />
      </View>
    );
  }

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessible ? `${rank} of ${suit}` : undefined}
      style={[
        styles.cardBase,
        {
          width: config.width,
          height: config.height,
          borderRadius: config.radius,
          borderColor: selected ? '#6366F1' : '#D1D5DB',
          borderWidth: selected ? 2 : 1,
        },
        selected && styles.cardSelected,
        style,
      ]}
    >
      {/* Top-Left Corner Pip */}
      <View style={styles.topLeftCorner}>
        <Text style={[styles.rankText, { fontSize: config.fontSize, color: suitColor }]}>
          {rank}
        </Text>
        <SuitGlyph suit={suit} size={config.suitSize} color={suitColor} />
      </View>

      {/* Center Art / Pip Motif */}
      <View style={styles.centerContainer}>
        {['J', 'Q', 'K'].includes(rank) ? (
          <RoyaltyMotif rank={rank} suit={suit} size={config.centerSize} color={suitColor} />
        ) : (
          <SuitGlyph suit={suit} size={config.centerSize} color={suitColor} />
        )}
      </View>

      {/* Bottom-Right Corner Pip (Inverted) */}
      <View style={styles.bottomRightCorner}>
        <Text style={[styles.rankText, { fontSize: config.fontSize, color: suitColor }]}>
          {rank}
        </Text>
        <SuitGlyph suit={suit} size={config.suitSize} color={suitColor} />
      </View>
    </View>
  );
});

// ============================================================================
// SVG Suit Glyph Renderer
// ============================================================================

export function SuitGlyph({
  suit,
  size = 16,
  color = '#1A1C23',
}: {
  suit: Suit;
  size?: number;
  color?: string;
}) {
  switch (suit) {
    case 'spades':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2C10 5.5 5 10 5 14a5 5 0 0 0 7 4.58A5 5 0 0 0 19 14c0-4-5-8.5-7-12zm-1 16.5v3.5h2v-3.5a7 7 0 0 1-2 0z" />
        </Svg>
      );
    case 'hearts':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </Svg>
      );
    case 'diamonds':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2L4 12l8 10 8-10L12 2z" />
        </Svg>
      );
    case 'clubs':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12 2a4 4 0 0 0-3.87 5.03 4 4 0 1 0-3.1 6.47A4 4 0 0 0 11 17.5v4.5h2v-4.5a4 4 0 0 0 5.97-3.99 4 4 0 1 0-3.1-6.48A4 4 0 0 0 12 2z" />
        </Svg>
      );
  }
}

// ============================================================================
// Royalty Center Badge (J, Q, K)
// ============================================================================

function RoyaltyMotif({
  rank,
  suit,
  size,
  color,
}: {
  rank: Rank;
  suit: Suit;
  size: number;
  color: string;
}) {
  return (
    <View style={[styles.royaltyFrame, { width: size * 1.3, height: size * 1.5, borderColor: color }]}>
      <Text style={[styles.royaltyRank, { fontSize: size * 0.5, color }]}>{rank}</Text>
      <SuitGlyph suit={suit} size={size * 0.4} color={color} />
    </View>
  );
}

// ============================================================================
// Alambre Wireframe Card Back Pattern
// ============================================================================

export function CardBackPattern({
  width,
  height,
  radius,
}: {
  width: number;
  height: number;
  radius: number;
}) {
  const pad = 3;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const cx = innerW / 2;
  const cy = innerH / 2;

  // Proportional concentric diamonds centered at (cx, cy)
  const maxRx = (innerW - 12) / 2;
  const maxRy = (innerH - 12) / 2;

  const diamondPath = (rx: number, ry: number) =>
    `M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`;

  const nodeRx = Math.min(10, maxRx * 0.28);
  const nodeRy = Math.min(10, maxRy * 0.28);

  return (
    <View style={[styles.cardBackInner, { width: innerW, height: innerH, borderRadius: Math.max(3, radius - 2) }]}>
      <Svg width={innerW} height={innerH} viewBox={`0 0 ${innerW} ${innerH}`}>
        {/* Deep Slate Canvas */}
        <Rect
          x={0}
          y={0}
          width={innerW}
          height={innerH}
          fill="#1E293B"
          rx={Math.max(3, radius - 2)}
        />

        {/* Dashed Inner Frame */}
        <Rect
          x={3}
          y={3}
          width={innerW - 6}
          height={innerH - 6}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1}
          strokeDasharray="3 2"
          rx={Math.max(2, radius - 3)}
        />

        {/* Alambre Concentric Diamonds (Zero Transform Drift) */}
        <G stroke="#0284C7" strokeWidth={0.8} opacity={0.65}>
          <Path d={diamondPath(maxRx, maxRy)} fill="none" />
          <Path d={diamondPath(maxRx * 0.72, maxRy * 0.72)} fill="none" />
          <Path d={diamondPath(maxRx * 0.44, maxRy * 0.44)} fill="none" />
        </G>

        {/* Center Node Diamond */}
        <Path
          d={diamondPath(nodeRx, nodeRy)}
          fill="#0284C7"
          stroke="#38BDF8"
          strokeWidth={0.8}
        />
        <Circle cx={cx} cy={cy} r={Math.max(2, nodeRx * 0.28)} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
    justifyContent: 'space-between',
    padding: 4,
  },
  cardSelected: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBackContainer: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  cardBackInner: {
    overflow: 'hidden',
  },
  topLeftCorner: {
    alignItems: 'center',
    width: 20,
    gap: 1,
  },
  bottomRightCorner: {
    alignItems: 'center',
    width: 20,
    gap: 1,
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontWeight: '800',
    lineHeight: 14,
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  royaltyFrame: {
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    gap: 2,
  },
  royaltyRank: {
    fontWeight: '900',
  },
});
