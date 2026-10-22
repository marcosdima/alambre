import { createConfigProvider } from 'alambre';
import { storage } from '../storage';

const config = {
  greeting: 'Hello from alambre',
  fontFamily: 'Inter',
};

export const { ConfigProvider, useConfig } = createConfigProvider(
  config,
  storage,
);
