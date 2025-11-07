import React from "react";
import { Animated } from "react-native";
import { AnimadoChild, parseConfig, State } from "./utils";
import { AnimadoTypes } from "@types";

type AnimWrapperProps = AnimadoTypes.AnimadoProps & {
  child: AnimadoChild;
  anim: Animated.Value;
  state: State,
};

export default (
  {
    child: {
      raw,
    },
    config,
    state,
    anim,
  }: AnimWrapperProps
) => {
  const stateConfig = config?.[state]?.fields ?? {};
  const style = parseConfig(anim, stateConfig);
  
  return (
    <Animated.View style={style}>
      {raw}
    </Animated.View>
  );
}