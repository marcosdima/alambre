import { createConfigProvider } from '@providers';
import { getItem, saveItem } from 'src/utils/storage';

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
