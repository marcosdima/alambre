import { createConfigProvider } from 'alambre';
import { storage } from '../storage';

const config = {
  greeting: 'Hello from alambre',
};

export const { ConfigProvider, useConfig } = createConfigProvider(
  config,
  storage,
);
