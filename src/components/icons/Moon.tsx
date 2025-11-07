import Svg, { CircleProps, LineProps } from "react-native-svg";
import { AnimatedCircle, svgBaseConfig, AnimatedLine } from "./utils";
import { DefaultReact } from "@types";
import { View } from "@base";
import { StyleSheet } from "react-native";
import { SharedValue, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

const RADIUS = 35
const CIRCUMFERENCE = (2 * Math.PI * RADIUS);

const baseConfig = {
  fillOpacity: 0,
  stroke: 'black',
  strokeWidth: 3,
  strokeDashoffset: 100,
  strokeDasharray: CIRCUMFERENCE,
  r: RADIUS,
}

const circleConfig: CircleProps = {
  ...baseConfig,
  strokeDasharray: CIRCUMFERENCE,
  cx: 50,
  cy: 50,
  r: RADIUS,
};

type SunProps = DefaultReact.ViewProps & {
  reset: boolean;
}

export default ({ reset, ...props } : SunProps) => {
  const progressCircle = useSharedValue(CIRCUMFERENCE); 
  const progressSmallCircle = useSharedValue(CIRCUMFERENCE); 

  const createAnimatedProps = (shared: SharedValue<number>) =>(
    useAnimatedProps(() => ({
      strokeDashoffset: withTiming(shared.value, { duration: 1000 }),
    }))
  );

  const animatedCircleProps = createAnimatedProps(progressCircle);
  const animatedSmallCircleProps = createAnimatedProps(progressSmallCircle);

  useEffect(() => {
    progressCircle.value = reset ? CIRCUMFERENCE : (CIRCUMFERENCE * 0.25);
    progressSmallCircle.value = reset ? CIRCUMFERENCE : (-175);
  }, [reset]);

  return (
    <View {...props}>
      <View style={styles.container}>
        <Svg {...svgBaseConfig}>
          <AnimatedCircle
            animatedProps={animatedCircleProps}
            {...circleConfig}
          />
          <AnimatedCircle
            animatedProps={animatedSmallCircleProps}
            transform='rotate(-7, 50, 50)'
            {...circleConfig}
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 25,
  }
});