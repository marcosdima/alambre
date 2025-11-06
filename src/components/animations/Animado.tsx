import React, { useEffect, useRef, useState } from "react";
import { AnimadoTypes } from "@types";
import AnimadoWrapper from "./AnimadoWrapper";
import useAnimado from "./use-animado";
import {
  getAnimadoChild,
  AnimadoChild,
  findByKey,
  findBySignature,
  State,
} from './utils';
import { Animated } from "react-native";

type UpdateState = Partial<Record<State, AnimadoChild[]>>;

export default (
  {
    children,    // Children to render.
    config,     // Start-End-Update-Idle animation config.
    propagate, // What to propagate to children.
    ...props
  }: AnimadoTypes.AnimadoProps
) => {
  const childArray = React.Children.toArray(children) as React.ReactElement[];
  const currChildrenInfo = childArray.map(getAnimadoChild).filter((c) => c !== null);
  const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);
  const childrenState = useRef<Record<string, State>>({});

  const {
    renderedChildren,
    animationValues,
    removeChild,
    addChild,
  } = useAnimado(currChildrenInfo);
 
  // Update hooks.
  const [updateChildren, setUpdateChildren] = useState<UpdateState>({})
  const updateState = (newState: UpdateState) => {
    Object.keys(newState).forEach((k) => {
      const key = k as State; // It's always state...
      const arr = newState[key];

      // Set states.
      arr?.forEach((c) => childrenState.current[c.key] = key);
      setUpdateChildren(prev => ({ ...prev, [key]: arr }));
    })
  }
  const removeState = (state: State) => {
    setUpdateChildren(prev => {
      const { [state]: _, ...rest } = prev;
      return rest;
    });
  };

  // First render.
  useEffect(() => updateState({ start: currChildrenInfo }), []);

  useEffect(() => {
    const toRemove = [] as AnimadoChild[];
    const toUpdate = [] as AnimadoChild[];
    const toAppend = currChildrenInfo.filter((c) => !findByKey(renderedChildren, c));
    
    renderedChildren.forEach(
      (renderedChild) => {
        const exists = findByKey(currChildrenInfo, renderedChild);
        if (exists) {
          const same = findBySignature(currChildrenInfo, renderedChild);
          if (!same) toUpdate.push(exists);
        } else {
          toRemove.push(renderedChild);
        }
      }
    );

    const update = {} as UpdateState;
    
    // Missing update.
    if (toRemove.length > 0) update['end'] = toRemove;
    if (toAppend.length > 0) {
      toAppend.forEach(addChild);
      update['start'] = toAppend;
    }
    
    if (Object.keys(update).length > 0) updateState(update);
  }, [children]);

  // On update.
  useEffect(() => {
    const execAnimations = (state: State, onEnd?: () => void) => {
      // Animations array.
      const animations: Animated.CompositeAnimation[] = [];
      
      // Checks that exists an update array.
      const arr = updateChildren[state];
      if (!arr) return;
      
      // Checks if exists a propagate config for this state.
      const config = propagate?.[state];
      if (!config) return;

      // For each children, creates an animation.
      arr.forEach(
        (c) => {
          const childAnim = animationValues[c.key];
          childAnim.setValue(0);

          const anim = Animated.timing(
            childAnim,
            {
              toValue: 1,
              duration: config.duration ?? 0,
              useNativeDriver: true,
            }
          );

          animations.push(anim);
        }
      );

      const seq = Animated.stagger(config.stagger ?? 0, animations);
      activeAnimations.current.push(seq);
      
      seq.start(({ finished }) => {
        // Clean animations.
        activeAnimations.current = activeAnimations.current.filter((a) => a !== seq);

        if (finished) {
          onEnd?.();
          removeState(state);
        }
      });
    }

    if (updateChildren.end) execAnimations('end', () => updateChildren.end?.forEach((c) => removeChild(c)));
    else if (updateChildren.start) execAnimations('start');
  }, [updateChildren]);

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
    <Animated.View {...props}>
      {
        renderedChildren.map(
          (c, i) => {
            const anim = animationValues[c.key];
            if (!anim) return;

            return (
              <AnimadoWrapper
                key={i}
                child={c}
                config={propagate ?? {}}
                anim={animationValues[c.key]}
                state={childrenState.current[c.key]}
              />
            )
          }
        )
      }
    </Animated.View>
  )
}