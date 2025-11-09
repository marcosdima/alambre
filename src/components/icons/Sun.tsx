import Svg, { CircleProps, LineProps } from "react-native-svg";
import { AnimatedCircle, svgBaseConfig, AnimatedLine } from "./utils";
import { DefaultReact } from "@types";
import { View } from "@base";
import { StyleSheet } from "react-native";
import { SharedValue, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import Circle from "./base/Circle";

const lineConfig: LineProps = {
  fillOpacity: 0,
  stroke: 'black',
  strokeWidth: 3,
  strokeDashoffset: 100,
  strokeDasharray: 100,
  y1: 50,
  x2: 50,
  y2: 50,
};

const circleBaseConfig: CircleProps = {
  cx: 50,
  cy: 50,
  r: 23,
  stroke: 'black',
  fill: 'orange',
  strokeWidth: 3,
  strokeDashoffset: 100,
};

type SunProps = DefaultReact.ViewProps & {
  reset: boolean;
}

export default ({ reset, ...props } : SunProps) => {
  const progress = useSharedValue(100);
  const progressShort = useSharedValue(100); 

  const createAnimatedProps = (shared: SharedValue<number>) =>(
    useAnimatedProps(() => ({
      strokeDashoffset: withTiming(shared.value, { duration: 1000 }),
    }))
  );

  const animatedProps = createAnimatedProps(progress);
  const animatedShortProps = createAnimatedProps(progressShort);

  useEffect(() => {
    progress.value = reset ? 100 : 80;
    progressShort.value = reset ? 100 : 85;
  }, [reset]);

  const circle = {
    circle: {
      ...circleBaseConfig,
      fillOpacity: reset ? 0 : 1,
    },
    reset,
  }

  return (
    <View {...props}>
      <Svg {...svgBaseConfig}>
        <Circle {...circle}/>
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
  );
};
