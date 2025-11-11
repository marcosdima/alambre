import type { DefaultReact } from '@types';
import type { ReactNode } from 'react';
import { createContext, useContext, useRef, useState } from 'react';

// Types-
type AnimationDefault = 'to-left' | 'to-right';

type Page = {
  component: ReactNode;
  transition?: AnimationDefault;
  subpages?: NavigatorObject;
}

type NavigatorObject = Record<string, Page>;

type NavigatorReturn = {
  currentPage: Page;
  pageKey: string;
  noPreviusPages: boolean;
  navigate: (target: string) => void;
  previous: () => void;
};

type NavigatorProviderProps = DefaultReact.ViewProps & {
  pages: NavigatorObject;
};

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
    setTimeout(() => updatePage(target), 100);
  };

  return {
    currentPage: pages[currentPage],
    pageKey: stack.current.join(', '),
    noPreviusPages: stack.current.length === 0,
    navigate,
    previous,
  };
};

const NavigatorContext = createContext<NavigatorReturn | undefined>(undefined);


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
