import { useRef, useState, useEffect } from "react";
import { AnimadoChild } from "./utils";
import { Animated } from "react-native";

export default (base: AnimadoChild[]) => {
  const [renderedChildren, setRenderedChildren] = useState<AnimadoChild[]>(base);
  const animationValues = useRef<Record<string, Animated.Value>>({}).current;

  useEffect(() => (
    base.forEach((c) => animationValues[c.key] = new Animated.Value(0))
  ), [])

  const removeChildren = (info: AnimadoChild[]) => {
    const update = renderedChildren.filter((c) => !info.some((c2) => c2.key === c.key))
    Object.keys(animationValues).forEach(
      (k) => !update.some((c) => c.key === k) && delete animationValues[k]
    );
    setRenderedChildren(update);
  };

  const addChildren = (info: AnimadoChild[]) => {
    info.forEach(child => {
      animationValues[child.key] = new Animated.Value(0);
    });
    setRenderedChildren(prev => [...prev, ...info]);
  };

  const updateChildren = (info: AnimadoChild[]) => {
    setRenderedChildren(prev =>
      prev.map(child => {
        const updated = info.find(c => c.key === child.key);
        return updated
          ? {
              ...child,
              props: updated.props,
              children: updated.children,
              raw: updated.raw,
            }
          : child;
      })
    );
  };


  return {
    renderedChildren,
    animationValues,
    removeChildren,
    addChildren,
    updateChildren,
  };
}