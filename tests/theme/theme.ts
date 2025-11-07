import { createLightDarkProvider } from "@providers";
import { getItem, saveItem } from "src/utils/storage";

export const light = {
  color: 'black',
  background: 'white',
}

export const dark = {
  color: 'white',
  background: 'black',
}

const storage = {
  set: saveItem,
  get: getItem,
}

export const { LightDarkProvider, useLightDark } = createLightDarkProvider<typeof light>(light, dark, storage);