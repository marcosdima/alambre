import { View } from '@base';
import type { DefaultReact } from '@types';
import type { ReactNode } from 'react';
import { createContext, useContext, useRef, useState } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import Arrow from 'src/components/icons/Arrow';

type AnimationDefault = 'to-left' | 'to-right';

type Page = {
  component: ReactNode;
  transition?: AnimationDefault;
  subpages?: NavigatorObject;
}

type NavigatorObject = Record<string, Page>;

const useNavigartorContext = (pages: NavigatorObject) => {
  type Key = keyof NavigatorObject;

  const firstPage = Object.keys(pages).shift() as Key;
  const stack = useRef<Key[]>([]);
  const [currentPage, updatePage] = useState<Key>(firstPage);

  const navigate = (target: Key) => {
    stack.current.push(currentPage);
    updatePage(target);
  };

  const previous = () => {
    const target = stack.current.pop();
    if (!target) return;
    updatePage(target);
  };

  return {
    currentPage: pages[currentPage],
    navigate,
    previous,
    noPreviusPages: stack.current.length > 0,
  };
};

type NavigatorReturn = {
  currentPage: Page;
  navigate: (target: string) => void;
  previous: () => void;
  noPreviusPages: boolean;
};
const NavigatorContext = createContext<NavigatorReturn | undefined>(undefined);

type NavigatorProviderProps = DefaultReact.ViewProps & {
  pages: NavigatorObject;
};
export const NavigatorProvider = (
  {
    children,
    pages,
    ...props
  }: NavigatorProviderProps,
) => {
  const value = useNavigartorContext(pages);
  return (
    <NavigatorContext.Provider {...props} value={value}>
      {children}
    </NavigatorContext.Provider>
  );
};

export const useNavigator = () => {
  const ctx = useContext(NavigatorContext);
  if (!ctx)
    throw new Error('useNavigator must be used within a NavigatorProvider');
  return ctx;
};

type NavigatorBodyProps = DefaultReact.ViewProps & {
   arrowColor?: ColorValue;
   width?: number,
   pressStyle?: StyleProp<ViewStyle>,
};
export const NavigatorBody = (
  {
    children: _children,
    arrowColor = 'black',
    width = 4,
    style,
    ...props
  }: NavigatorBodyProps,
) => {
  const {
    pressStyle = {
      height: '3.5%',
      width: '12.5%',
      position: 'absolute',
      top: 10,
      left: 10,

      zIndex: 999,
      borderColor: arrowColor,
      borderRadius: 50,
      borderWidth: 2,
      padding: 2,
    },
  } = props;
  const { previous, currentPage, noPreviusPages } = useNavigator();

  return (
    <View
      style={[{ position: 'relative', flex: 1 }, style]}
      {...props}
    >
      <Pressable
        onPressOut={previous}
        style={[StyleSheet.absoluteFillObject, pressStyle]}
      >
        <Arrow
          reset={!noPreviusPages}
          color={arrowColor}
          lineWidth={width}
          rotate={180}
        />
      </Pressable>
      {currentPage.component}
    </View>
  );
};
