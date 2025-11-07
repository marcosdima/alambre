import { AnimadoTypes, DefaultReact } from "@types"
import React, { ReactElement } from "react";
import { Animated } from "react-native";

export type State = AnimadoTypes.State;
export type AnimadoChild = DefaultReact.ChildInfo;

export const parseConfig = (
    anim: Animated.Value,
    {
        opacity,
        scale,
        translateX,
        translateY,
        rotate,
    }: AnimadoTypes.AnimadoFields
) => {
    const result = {};
    if (opacity) Object.assign(result, { opacity: parseValue(opacity, anim) });

    const transforms = [];
    if (scale) transforms.push({ scale: parseValue(scale, anim) });
    if (translateX) transforms.push({ translateX: parseValue(translateX, anim) });
    if (translateY) transforms.push({ translateY: parseValue(translateY, anim) });
    if (rotate) transforms.push({ rotate: parseValue(rotate, anim) });
    if (transforms.length > 0) Object.assign(result, { transform: transforms });
    
    return result;
}

export const parseValue = ({ from, to }: AnimadoTypes.AnimadoValue, anim: Animated.Value) => {
  return anim.interpolate({
    inputRange: [0, 1],
    outputRange: [from, to],
  });
}

 export const findByKey = (arr: AnimadoChild[], target: AnimadoChild) => (
  arr.find((c) => c.key === target.key)
);

export const findBySignature = (arr: AnimadoChild[], target: AnimadoChild) => {
  const targetSignature = getSignature(target);
  return arr.find((c) => getSignature(c) === targetSignature);
};

export const getAnimadoChild = (child: ReactElement) => {
  if (React.isValidElement(child)) {
    const element = child as React.ReactElement<any>;
    return {
      key: element.key,
      props: element.props,
      children: React.Children.toArray(element.props.children),
      raw: child,
      state: 'start',
    } as AnimadoChild;
  }
  return null;
}

export const getSignature = ({ raw, ...info }: AnimadoChild) => JSON.stringify(info);
