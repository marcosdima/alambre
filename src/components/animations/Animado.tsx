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
    removeChildren,
    addChildren,
    updateChildren,
  } = useAnimado(currChildrenInfo);
 
  // Update hooks.
  const [updateChildrenArray, setUpdateChildrenArray] = useState<UpdateState>({})
  const updateState = (newState: UpdateState) => {
    setUpdateChildrenArray(prev => {
      const next = { ...prev };

      Object.entries(newState).forEach(([k, arr]) => {
        const key = k as State;
        if (!arr) return;

        for (const s of Object.keys(next) as State[]) {
          if (s !== key) {
            next[s] = next[s]?.filter(c => !arr.some(x => x.key === c.key)) ?? [];
          }
        }

        next[key] = arr;
        arr.forEach(c => (childrenState.current[c.key] = key));
      });

      return next;
    });
  };
  const removeState = (state: State) => {
    setUpdateChildrenArray(prev => {
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
    if (toRemove.length > 0) update.end = toRemove;
    if (toAppend.length > 0) {
      addChildren(toAppend);
      update.start = toAppend;
    }
    if (toUpdate.length > 0) {
      updateChildren(toUpdate);
      update.update = toUpdate;
    }
    
    if (Object.keys(update).length > 0) updateState(update);
  }, [children]);

  // On update.
  useEffect(() => {
    const execAnimations = (state: State, onEnd?: () => void) => {
      // Animations array.
      const animations: Animated.CompositeAnimation[] = [];
      
      // Checks that exists an update array.
      const arr = updateChildrenArray[state];
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
        if (finished) {
          activeAnimations.current = activeAnimations.current.filter((a) => a !== seq);
          onEnd?.();
          removeState(state);
        }
      });
    }
    
    if (updateChildrenArray.end) execAnimations('end', () => removeChildren(updateChildrenArray.end ?? []));
    if (updateChildrenArray.start) execAnimations('start');
    if (updateChildrenArray.update) execAnimations('update');
  }, [updateChildrenArray]);

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