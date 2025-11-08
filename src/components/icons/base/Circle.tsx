import { CircleProps } from "react-native-svg";
import { useAnimatedProps, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { AnimatedCircle } from "../utils";

type CustomCircleProps = {
  reset: boolean;
  circle: CircleProps;
  rotation?: number;
  strokeOffset?: number;
};

const timingConfig = { duration: 1000 };

export default (
  {
    reset,
    circle,
    rotation = 0,
    strokeOffset = 0,
  }: CustomCircleProps
) => {
  const strokeDasharray = useMemo(
    () => 2 * Math.PI * (circle.r as number),
    [circle.r]
  );

  const progressCircle = useSharedValue(strokeDasharray);
  
  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: progressCircle.value,
    fillOpacity: withTiming(
      circle.fillOpacity && !reset && circle.fillOpacity as number > 0
        ? 1
        : 0,
      timingConfig
    ),
  }));

  useEffect(() => {
    progressCircle.value = withTiming(
      reset ? strokeDasharray : strokeDasharray * (strokeOffset / 100),
      timingConfig
    );
  }, [reset]);

  const modCircle: CircleProps = {
    ...circle,
    strokeDasharray,
    transform: `rotate(${rotation}, ${circle.cx}, ${circle.cy})`,
  };

  return <AnimatedCircle animatedProps={animatedCircleProps} {...modCircle} />;
};
