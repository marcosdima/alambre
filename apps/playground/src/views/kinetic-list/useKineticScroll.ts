import { useSharedValue, withDecay, withSpring, cancelAnimation, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export function useKineticScroll(
  snapEnabled: SharedValue<boolean>,
  itemSize: SharedValue<number>,
  itemCount: number,
  damping: SharedValue<number>,
) {
  const currentIndex = useSharedValue(0);
  const startIndex = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(currentIndex);
      startIndex.value = currentIndex.value;
    })
    .onUpdate((e) => {
      currentIndex.value = startIndex.value - (e.translationX / itemSize.value);
    })
    .onEnd((e) => {
      const velocityIndex = -e.velocityX / itemSize.value;
      const minBound = 0;
      const maxBound = itemCount - 1;

      if (snapEnabled.value) {
        const projectedIndex = currentIndex.value + velocityIndex * 0.2;
        let targetIndex = Math.round(projectedIndex);
        if (targetIndex < minBound) targetIndex = minBound;
        if (targetIndex > maxBound) targetIndex = maxBound;

        currentIndex.value = withSpring(targetIndex, { velocity: velocityIndex, damping: damping.value, stiffness: 100 });
      } else {
        currentIndex.value = withDecay({
          velocity: velocityIndex,
          clamp: [minBound, maxBound],
        });
      }
    });

  const translation = useDerivedValue(() => {
    return -currentIndex.value * itemSize.value;
  });

  return { translation, gesture, currentIndex };
}
