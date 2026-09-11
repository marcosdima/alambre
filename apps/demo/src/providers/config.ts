import { createConfigProvider } from 'alambre';
import { getItem, saveItem } from '../utils/storage';

const config = {
  alias: '',
  dateFormat: 'DD/MM/YYYY',
  batteryOptions: 'default',
};
const storage = {
  set: saveItem,
  get: getItem,
};

export const { ConfigProvider, useConfig } = createConfigProvider(config, storage);
