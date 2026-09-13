import { createConfigProvider } from 'alambre';
import { getItem, saveItem } from '../utils/storage';

const config = {
  leaveGraceMinutes: '10',
};
const storage = {
  set: saveItem,
  get: getItem,
};

export const { ConfigProvider, useConfig } = createConfigProvider(config, storage);
