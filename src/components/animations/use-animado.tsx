import { useRef, useState, useEffect } from "react";
import { AnimadoChild, State } from "./utils";
import { Animated } from "react-native";

export default (base: AnimadoChild[]) => {
  const [renderedChildren, setRenderedChildren] = useState<AnimadoChild[]>(base);
  const animationValues = useRef<Record<string, Animated.Value>>({}).current;

  useEffect(() => (
    base.forEach((c) => animationValues[c.key] = new Animated.Value(0))
  ), [])

  const removeChild = (info: AnimadoChild) => {
    const update = renderedChildren.filter((c) => c.key !== info.key)
    delete animationValues[info.key];
    setRenderedChildren(update);
  };

  const addChild = (info: AnimadoChild) => {
    animationValues[info.key] = new Animated.Value(0);
    setRenderedChildren(prev => [ ...prev, info ]);
  };

  return {
    renderedChildren,
    animationValues,
    removeChild,
    addChild,
  };
}