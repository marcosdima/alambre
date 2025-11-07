import { createConfigProvider } from "src/providers/create-config-provider"
import { getItem, saveItem } from "src/utils/storage";

const config = {
    alias: '',
    dateFormat: 'DD/MM/YYYY',
    batteryOptions: 'default',
}
const storage = {
  set: saveItem,
  get: getItem,
}

export const { ConfigProvider, useConfig } = createConfigProvider<typeof config>(config, storage);