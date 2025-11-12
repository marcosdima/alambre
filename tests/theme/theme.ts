import { createLightDarkProvider } from 'src/providers';
import { getItem, saveItem } from 'src/utils/storage';

export const light = {
  color: 'black',
  background: 'white',
};

export const dark = {
  color: 'white',
  background: 'black',
};

const storage = {
  set: saveItem,
  get: getItem,
};

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);
