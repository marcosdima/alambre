import { describe, expect, it } from 'vitest';
import { calculateResponsiveHandFan } from '../../src/core/spatial';

describe('calculateResponsiveHandFan with totalCapacity', () => {
  const cards = [
    { id: 'c1', label: 'Ace' },
    { id: 'c2', label: 'King' },
    { id: 'c3', label: 'Queen' },
  ];

  it('keeps slot positions stationary when progressive cards arrive under fixed totalCapacity', () => {
    // 1 card landed out of 7
    const fan1 = calculateResponsiveHandFan([cards[0]], {
      totalCapacity: 7,
      containerWidth: 400,
    });

    // 2 cards landed out of 7
    const fan2 = calculateResponsiveHandFan([cards[0], cards[1]], {
      totalCapacity: 7,
      containerWidth: 400,
    });

    // 3 cards landed out of 7
    const fan3 = calculateResponsiveHandFan([cards[0], cards[1], cards[2]], {
      totalCapacity: 7,
      containerWidth: 400,
    });

    // Verify card 0 (c1) remains at the exact same translateX, translateY, and rotation across all 3 steps!
    expect(fan1.slots[0].translateX).toBe(fan2.slots[0].translateX);
    expect(fan1.slots[0].translateY).toBe(fan2.slots[0].translateY);
    expect(fan1.slots[0].rotateDeg).toBe(fan2.slots[0].rotateDeg);

    expect(fan2.slots[0].translateX).toBe(fan3.slots[0].translateX);
    expect(fan2.slots[0].translateY).toBe(fan3.slots[0].translateY);
    expect(fan2.slots[0].rotateDeg).toBe(fan3.slots[0].rotateDeg);

    // Verify card 1 (c2) remains stationary between 2 cards and 3 cards
    expect(fan2.slots[1].translateX).toBe(fan3.slots[1].translateX);
    expect(fan2.slots[1].translateY).toBe(fan3.slots[1].translateY);
    expect(fan2.slots[1].rotateDeg).toBe(fan3.slots[1].rotateDeg);
  });

  it('generates reservedSlots for unlanded indices when totalCapacity > items.length', () => {
    const fan = calculateResponsiveHandFan([cards[0]], {
      totalCapacity: 5,
      containerWidth: 400,
    });

    expect(fan.slots).toHaveLength(1);
    expect(fan.reservedSlots).toBeDefined();
    expect(fan.reservedSlots).toHaveLength(4); // indices 1, 2, 3, 4

    // Verify the first reserved slot matches what index 1 would be
    const fan2 = calculateResponsiveHandFan([cards[0], cards[1]], {
      totalCapacity: 5,
      containerWidth: 400,
    });

    expect(fan.reservedSlots![0].translateX).toBe(fan2.slots[1].translateX);
    expect(fan.reservedSlots![0].translateY).toBe(fan2.slots[1].translateY);
    expect(fan.reservedSlots![0].centerCoord).toEqual(fan2.slots[1].centerCoord);
  });

  it('behaves identically to standard layout when totalCapacity is omitted or less than items.length', () => {
    const fanStandard = calculateResponsiveHandFan(cards);
    const fanWithLowCapacity = calculateResponsiveHandFan(cards, { totalCapacity: 2 });

    expect(fanStandard.slots).toHaveLength(3);
    expect(fanStandard.reservedSlots).toEqual([]);
    expect(fanWithLowCapacity.slots).toHaveLength(3);
    expect(fanWithLowCapacity.slots[0].translateX).toBe(fanStandard.slots[0].translateX);
  });
});
