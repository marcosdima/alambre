import type { NavigatorTypes } from '../types';
import { createContext, useContext, useRef, useState } from 'react';


const useNavigartorContext = (pages: NavigatorTypes.NavigatorObject) => {
  const firstPage = Object.keys(pages).shift() ?? '';
  const stack = useRef<string[]>([]);
  const [currentPage, updatePage] = useState<string>(firstPage);
  const [scrollTop, setScrollTop] = useState<number>(0);

  const previous = () => {
    const target = stack.current.pop();
    if (!target) return;
    setScrollTop(0);
    updatePage(target);
  };

  const navigate = (
    target: string,
    settings: NavigatorTypes.NavigationSettings = {},
  ) => {
    const { subpage } = settings;
    const aux = subpage
      ? `${target},${subpage}`
      : String(target);
    stack.current.push(currentPage);
    setScrollTop(0);
    updatePage(aux);
  };


  const getComponent = (path: string[]) => {
    // Get the first key, if it does not exist then goes to the first page.
    const firstKey = path.shift();
    if (!firstKey) return pages[firstPage];

    // Get that page and, if that's all it is, return it.
    const first = pages[firstKey];
    if (path.length === 0) return first;

    // Follow the path.
    return path.reduce(
      (acc, key) => acc?.subpages?.[key],
      first as NavigatorTypes.Page | undefined,
    ) ?? first;
  };

  return {
    currentPage: getComponent(currentPage.split(',')),
    pageKey: stack.current.join(', '),
    noPreviousPages: stack.current.length === 0,
    scrollTop,
    navigate,
    previous,
    setScrollTop,
  };
};

const NavigatorContext = createContext<NavigatorTypes.NavigatorReturn | undefined>(undefined);

export const NavigatorProvider = (
  {
    children,
    pages,
    ...props
  }: NavigatorTypes.NavigatorProviderProps,
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
