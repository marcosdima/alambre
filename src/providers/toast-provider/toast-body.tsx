import { StyleSheet } from 'react-native';
import { View, Text, Title } from '../../components/base';
import Animated, { BounceInUp, BounceOutUp, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';
import useToast from './use-toast';
import Cross from 'src/components/icons/Cross';
import Tick from 'src/components/icons/Tick';
import type { ToastBodyProps } from './types';

export default ({ palette = {}, delay = 700, animationTime = 800 }: ToastBodyProps) => {
  const {
    backgroundColor = '#9fafb9ff',
    type = {
      info: 'green',
      error: 'red',
      warning: 'yellow',
    },
    text = 'black',
  } = palette;

  const { toast: { data, startedAt } } = useToast();

  const progress = useSharedValue(0);
  const remaining = useMemo(() => {
    const elapsed = startedAt
      ? Date.now() - new Date(startedAt).getTime() - delay
      : 0.0;
    return Math.max(0, data.duration - elapsed - delay);
  }, [data.duration, delay, startedAt]);

  useEffect(() => {
    progress.value = withTiming(1, { duration: remaining });
  }, [progress, remaining]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const iconConfig = {
    color: data.type === 'info' ? 'green' : 'red',
    lineWidth: 5,
  };

  const title = data.type.charAt(0).toUpperCase() + data.type.slice(1);

  return (
    <Animated.View
      style={styles.contanier}
      entering={BounceInUp.duration(animationTime).delay(delay).easing(Easing.ease)}
      exiting={BounceOutUp.duration(animationTime).easing(Easing.ease)}
      pointerEvents="none"
    >
      <View style={[styles.toast, { backgroundColor }]}>
        <View style={styles.info}>
          <View style={styles.icon}>
            { data.type === 'error' ? <Cross {...iconConfig}/> : <Tick {...iconConfig}/> }
          </View>
          <View style={styles.text}>
            <Title style={{ color: type[data.type] }}>{title}</Title>
            <Text style={{ color: text }}>{data.content}</Text>
          </View>
        </View>
        <View style={[styles.barBackground, { backgroundColor: text }]}>
          <Animated.View
            style={
              [styles.barFill, barStyle, { backgroundColor: type[data.type] }]
            }
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contanier: {
    width: '100%',
    height: '30%',
    position: 'absolute',
    zIndex: 999,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toast: {
    marginTop: 30,
    width: '95%',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingBottom: 20,
  },
  info: {
    flexDirection: 'row',
    width: '90%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 15,
  },
  text: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  barBackground: {
    height: 4,
    width: '90%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
});
