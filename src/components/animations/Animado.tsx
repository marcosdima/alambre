import React, { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { View } from '@base';
import { AnimadoTypes } from '@types';
import { parseConfig } from './utils';

const getKey = (child: React.ReactNode) => {
  if (!child) throw Error('Child of Animate cannot be null or undefined');

  const key =
    typeof child === 'object' && 'key' in child ? (child.key as string) : null;
  if (!key) throw Error('Each child of Animate must have a unique key prop');

  return key;
};

export default function Animate(
  {
    children,
    config,
    duration = 300,
    delay = 80,
    ...props
  }: AnimadoTypes.AnimadoProps
) {
  const childArray = React.Children.toArray(children) as ReactNode[];
  const animValues = useRef<Record<string, Animated.Value>>({});
  const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

  const [renderedChildren, setRenderedChildren] = useState<ReactElement[]>(
    () => childArray.map((c) => c as ReactElement)
  );

  useEffect(() => {
    // Current children keys.
    const currentKeys = childArray.map((c) => getKey(c));

    // Rendered children keys.
    const renderedKeys = renderedChildren.map((c) => getKey(c));

    // New children keys. (They weren't rendered)
    const enteringKeys = currentKeys.filter((k) => !renderedKeys.includes(k) || !animValues.current[k]);

    // Children rendered, they just stay.
    const exitingKeys = renderedKeys.filter((k) => !currentKeys.includes(k));

    // If there are new children...
    if (enteringKeys.length > 0) {
      // Update rendered children.
      setRenderedChildren(childArray as ReactElement[]);
    
      // Set new children animation values.
      const entranceAnims: Animated.CompositeAnimation[] = [];

      enteringKeys.forEach((key) => {
        animValues.current[key] = new Animated.Value(0);

        const anim = Animated.spring(
          animValues.current[key],
          {
            toValue: 1,
            useNativeDriver: true,
          }
        );

        entranceAnims.push(anim);
      });

      const seq = Animated.stagger(delay, entranceAnims);
      activeAnimations.current.push(seq);
      seq.start(() => {
        // Clean animations.
        activeAnimations.current = activeAnimations.current.filter((a) => a !== seq);
      });
    }

    // Animate exiting components and delete them.
    if (exitingKeys.length > 0) {
      const exitAnims: Array<{ key: string; anim: Animated.CompositeAnimation }> = [];

      exitingKeys.forEach((key) => {
        const val = animValues.current[key];
        if (!val) animValues.current[key] = new Animated.Value(1);

        const anim = Animated.timing(
          animValues.current[key],
          {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }
        );

        exitAnims.push({ key, anim });
      });

      const animList = exitAnims.map((e) => e.anim);
      const staggered = Animated.stagger(delay, animList);
      activeAnimations.current.push(staggered);

      staggered.start(({ finished }) => {
        activeAnimations.current = activeAnimations.current.filter((a) => a !== staggered);

        if (finished) {
          setRenderedChildren((prev) =>
            prev.filter((c) => !exitingKeys.includes(getKey(c)))
          );

          exitingKeys.forEach((k) => {
            delete animValues.current[k];
          });
        }
      });
    }
  }, [childArray]);

  useEffect(() => {
    return () => {
      activeAnimations.current.forEach((a) => {
        try {
          a.stop();
        } catch {}
      });
      activeAnimations.current = [];
    };
  }, []);

  return (
    <View {...props}>
      {
        renderedChildren.map((child) => {
          const key = getKey(child);

          const anim = animValues.current[key];
          const style = anim && config ? parseConfig(anim, config) : {};
          
          return (
            <Animated.View key={`inside-${key}`} style={style}>
              {child}
            </Animated.View>
          );
        })
      }
    </View>
  );
}
