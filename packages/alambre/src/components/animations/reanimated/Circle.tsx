import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

type Translate = {
  translationX: number,
  translationY: number,
}

const INITIAL = { translationX: 0, translationY: 0 };
const DELETE = { translationX: 100, translationY: 100 };

export default function App() {
  const pressed = useSharedValue<boolean>(false);
  const deletePosition = useSharedValue<boolean>(false);
  const offset = useSharedValue<Translate>(INITIAL);

  const pan = Gesture.Pan()
    .onBegin(() => {
      pressed.value = true;
    })
    .onChange(({ translationX, translationY }) => {
      deletePosition.value =
        translationX >= DELETE.translationX
        || translationY >= DELETE.translationY;
      offset.value = { translationX, translationY };
    })
    .onFinalize(() => {
      offset.value = withSpring(INITIAL);
      pressed.value = false;
      deletePosition.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => ({
    backgroundColor:
      withSpring(
        deletePosition.value
          ? 'red'
          : pressed.value
            ? '#FFE04B'
            : '#B58DF1',
      ),
    transform: [
      { scale: withTiming(pressed.value ? 1.2 : 1) },
      { translateX: withSpring(offset.value.translationX) },
      { translateY: withSpring(offset.value.translationY) },
    ],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.circle, animatedStyles]} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  circle: {
    height: 120,
    width: 120,
    borderRadius: 500,
  },
});
