import type { DefaultReact } from '@types';
import { Button } from 'react-native';
import Animated, { LinearTransition, useSharedValue, withSpring } from 'react-native-reanimated';

export default ({ children, ...props }: DefaultReact.ViewProps) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(scale.value + 0.2);
  };

  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={
        {
          transform: [
            {
              scale,
            },
          ],
        }
      }
      {...props}
    >
      {children}
      <Button onPress={handlePress} title="Click me" />
    </Animated.View>
  );
};
