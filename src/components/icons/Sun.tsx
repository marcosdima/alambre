import Svg, { CircleProps, LineProps } from "react-native-svg";
import { AnimatedCircle, svgBaseConfig, AnimatedLine } from "./utils";
import { DefaultReact } from "@types";
import { View } from "@base";
import { StyleSheet } from "react-native";
import { SharedValue, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

const RADIUS = 23
const CIRCUMFERENCE = (2 * Math.PI * RADIUS);

const baseConfig = {
  fillOpacity: 0,
  stroke: 'black',
  strokeWidth: 3,
  strokeDashoffset: 100,
}

const circleConfig: CircleProps = {
  ...baseConfig,
  strokeDasharray: CIRCUMFERENCE,
  cx: 50,
  cy: 50,
  r: RADIUS,
};

const lineConfig: LineProps = {
  ...baseConfig,
  strokeDasharray: 100,
  y1: 50,
  x2: 50,
  y2: 50,
};

type SunProps = DefaultReact.ViewProps & {
  reset: boolean;
}

export default ({ reset, ...props } : SunProps) => {
  const progress = useSharedValue(100);
  const progressShort = useSharedValue(100); 
  const progressCircle = useSharedValue(CIRCUMFERENCE); 

  const createAnimatedProps = (shared: SharedValue<number>) =>(
    useAnimatedProps(() => ({
      strokeDashoffset: withTiming(shared.value, { duration: 1000 }),
    }))
  );

  const animatedProps = createAnimatedProps(progress);
  const animatedShortProps = createAnimatedProps(progressShort);
  const animatedCircleProps = createAnimatedProps(progressCircle);

  useEffect(() => {
    progress.value = reset ? 100 : 80;
    progressShort.value = reset ? 100 : 85;
    progressCircle.value = reset ? CIRCUMFERENCE : 0;
  }, [reset]);

  return (
    <View {...props}>
      <View style={styles.container}>
        <Svg {...svgBaseConfig}>
          <AnimatedCircle
            animatedProps={animatedCircleProps}
            {...circleConfig}
          />
          { 
            [...Array(8)].map(
              (_, i) => {
                const even = i % 2 === 0;
                const auxlineConfig: LineProps = {
                  ...lineConfig,
                  x1: even ? 0 : 1,
                  transform: `rotate(${45 * i} 50 50)`,
                };
                return (
                  <AnimatedLine
                    key={i}
                    animatedProps={even ? animatedProps : animatedShortProps}
                    {...auxlineConfig}
                  />
                )
              }
            )
          }
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