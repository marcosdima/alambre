import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useWheelPicker } from '../../../../behaviors/wheel/useWheelPicker';

type PickerState = {
  currentPosition: SharedValue<number>;
  gesture: ReturnType<typeof useWheelPicker>['gesture'];
  allItems: number[];
  selected: number;
  itemWidth: number;
  visibleItems: number;
};

const PickerContext = createContext<PickerState | null>(null);

function usePickerContext() {
  const context = useContext(PickerContext);
  if (!context) throw new Error('Must be inside HorizontalPicker.Root');
  return context;
}

export type HorizontalPickerRootProps = Omit<ViewProps, 'style' | 'children'> & {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  itemWidth: number;
  visibleItems?: number;
  cycles?: number;
  style?: StyleProp<ViewStyle> | ((state: PickerState) => StyleProp<ViewStyle>);
  children?: ReactNode | ((state: PickerState) => ReactNode);
};

const Root = ({
  itemCount,
  selected,
  onSelect,
  itemWidth,
  visibleItems = 3,
  cycles,
  style,
  children,
  ...props
}: HorizontalPickerRootProps) => {
  const { currentPosition, gesture, allItems } = useWheelPicker({
    itemCount,
    selected,
    onSelect,
    rowHeight: itemWidth,
    cycles,
    horizontal: true,
  });

  const state = { currentPosition, gesture, allItems, selected, itemWidth, visibleItems };

  return (
    <PickerContext.Provider value={state}>
      <View {...props} style={[{ width: itemWidth * visibleItems, overflow: 'hidden' }, typeof style === 'function' ? style(state) : style]}>
        {typeof children === 'function' ? children(state) : children}
      </View>
    </PickerContext.Provider>
  );
};

const Track = ({ style, children, ...props }: Omit<ViewProps, 'children'> & { children: (item: number, index: number, selected: boolean) => ReactNode }) => {
  const { gesture, currentPosition, itemWidth, visibleItems, allItems, selected } = usePickerContext();
  const centerOffset = (Math.floor(visibleItems / 2)) * itemWidth;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: centerOffset - currentPosition.value * itemWidth }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View {...props} style={[{ flexDirection: 'row', width: allItems.length * itemWidth, height: '100%' }, animatedStyle, style]}>
        {allItems.map((item, index) => (
          <View key={index} style={{ width: itemWidth, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            {children(item, index, item === selected)}
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
};

export const HorizontalPicker = Object.assign(Root, { Root, Track });
export default HorizontalPicker;
