import { createConfigProvider } from 'alambre';
import { storage } from '../storage';

const config = {
  autoCross: 'true',
  defaultMode: 'zen',
  defaultDifficulty: 'easy',
};

export const { ConfigProvider, useConfig } = createConfigProvider(
  config,
  storage,
);
