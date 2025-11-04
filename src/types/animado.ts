import { DefaultReact } from "@types";

type InterpolationConfig = {
  inputRange: [number, number];
  outputRange: [number, number];
};

type AnimadoValue = boolean | InterpolationConfig;

type AnimadoConfig = {
  opacity?: AnimadoValue;
  scale?: AnimadoValue;
  translateX?: AnimadoValue;
  translateY?: AnimadoValue;
  rotate?: AnimadoValue;
};

type AnimadoProps = DefaultReact.ViewProps & {
  duration?: number;
  delay?: number;
  config?: AnimadoConfig;
};

export type { AnimadoProps, AnimadoConfig, AnimadoValue, InterpolationConfig };