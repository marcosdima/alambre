import { describe, expect, it } from 'vitest';
import type { PlayingCardData } from '../../src/views/card-game/types';
import { calculateResponsiveHandFan } from '../../src/views/card-game/engine/hand-fan';

describe('Hand Fan Engine', () => {
  const sampleCards: PlayingCardData[] = [
    { id: 'c1', suit: 'spades', rank: 'A' },
    { id: 'c2', suit: 'hearts', rank: 'K' },
    { id: 'c3', suit: 'diamonds', rank: 'Q' },
    { id: 'c4', suit: 'clubs', rank: 'J' },
    { id: 'c5', suit: 'spades', rank: '10' },
  ];

  it('handles empty hand gracefully', () => {
    const result = calculateResponsiveHandFan([]);
    expect(result.slots).toHaveLength(0);
    expect(result.effectiveSpacing).toBe(0);
    expect(result.totalWidth).toBe(0);
    expect(result.isCompressed).toBe(false);
  });

  it('centers single card with zero translation and zero rotation', () => {
    const result = calculateResponsiveHandFan([sampleCards[0]!]);
    expect(result.slots).toHaveLength(1);

    const slot = result.slots[0]!;
    expect(slot.translateX).toBe(0);
    expect(slot.translateY).toBe(0);
    expect(slot.rotateDeg).toBe(0);
    expect(slot.scale).toBe(1);
    expect(slot.zIndex).toBe(1);
  });

  it('distributes multiple cards symmetrically around center', () => {
    const result = calculateResponsiveHandFan(sampleCards.slice(0, 3));
    expect(result.slots).toHaveLength(3);

    const [left, center, right] = result.slots;

    // Center card (index 1) should be near center
    expect(center!.translateX).toBe(0);
    expect(center!.rotateDeg).toBe(0);

    // Left and right should be mirror opposites
    expect(left!.translateX).toBe(-right!.translateX);
    expect(left!.rotateDeg).toBe(-right!.rotateDeg);
    expect(left!.rotateDeg).toBeLessThan(0);
    expect(right!.rotateDeg).toBeGreaterThan(0);
  });

  it('auto-compresses spacing when hand exceeds containerWidth / maxSpan', () => {
    // 10 cards with baseSpacing 38 would naturally need (10 - 1) * 38 = 342px
    const largeHand: PlayingCardData[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c_${i}`,
      suit: 'spades',
      rank: 'A',
    }));

    // Pass maxSpan = 180
    const result = calculateResponsiveHandFan(largeHand, { maxSpan: 180, baseSpacing: 38 });

    expect(result.isCompressed).toBe(true);
    expect(result.effectiveSpacing).toBeLessThan(38);
    // Effective spacing should be approximately 180 / 9 = 20
    expect(result.effectiveSpacing).toBeCloseTo(20, 1);
    expect(result.totalWidth).toBeLessThanOrEqual(180);
  });

  it('lifts and straightens selected card', () => {
    const selectedId = sampleCards[1]!.id; // second card (normally tilted)
    const result = calculateResponsiveHandFan(sampleCards, {
      selectedCardId: selectedId,
      selectedLift: -35,
      selectedScale: 1.15,
      selectedStraightenFactor: 0.1,
    });

    const unselectedSlot = result.slots[0]!;
    const selectedSlot = result.slots.find((s) => s.card.id === selectedId)!;

    expect(selectedSlot).toBeDefined();
    expect(selectedSlot.scale).toBe(1.15);
    expect(selectedSlot.translateY).toBeLessThan(unselectedSlot.translateY);
    expect(selectedSlot.zIndex).toBe(999);
  });

  it('computes correct centerCoord with parent centerOffset', () => {
    const centerOffset = { x: 200, y: 400 };
    const result = calculateResponsiveHandFan(sampleCards.slice(0, 3), { centerOffset });

    const centerCard = result.slots[1]!;
    expect(centerCard.centerCoord.x).toBe(200);
    expect(centerCard.centerCoord.y).toBe(400);

    const leftCard = result.slots[0]!;
    expect(leftCard.centerCoord.x).toBeLessThan(200);
  });
});
