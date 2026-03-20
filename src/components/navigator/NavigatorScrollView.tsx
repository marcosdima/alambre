import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import { useNavigator } from '../../providers';

export default ({
  onScroll,
  scrollEventThrottle = 16,
  ...props
}: ScrollViewProps) => {
  const { setScrollTop } = useNavigator();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollTop(Math.max(0, event.nativeEvent.contentOffset.y));
    onScroll?.(event);
  };

  return (
    <ScrollView
      {...props}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle}
    />
  );
};
