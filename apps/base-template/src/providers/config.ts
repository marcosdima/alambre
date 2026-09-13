import { createConfigProvider } from 'alambre';
import { toAlambreStorage } from '../storage/alambre-storage';
import { asyncStorageRaw } from '../storage/async';

const config = {
  greeting: 'Hello from alambre',
};

export const { ConfigProvider, useConfig } = createConfigProvider(
  config,
  toAlambreStorage(asyncStorageRaw),
);
