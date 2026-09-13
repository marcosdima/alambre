import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type RouteIntent = {
  itemId?: string;
  alarmId?: string;
};

type RouteIntentValue = {
  intent: RouteIntent;
  setIntent: (intent: RouteIntent) => void;
};

const RouteIntentContext = createContext<RouteIntentValue | undefined>(undefined);

export const RouteIntentProvider = ({ children }: { children: ReactNode }) => {
  const [intent, setIntent] = useState<RouteIntent>({});

  const value = useMemo(() => ({ intent, setIntent }), [intent]);

  return <RouteIntentContext.Provider value={value}>{children}</RouteIntentContext.Provider>;
};

export const useRouteIntent = (): RouteIntentValue => {
  const ctx = useContext(RouteIntentContext);
  if (!ctx) throw new Error('useRouteIntent must be used within RouteIntentProvider');
  return ctx;
};
