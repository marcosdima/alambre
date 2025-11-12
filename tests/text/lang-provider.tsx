
import { createLangProvider } from '@providers';
import { getItem, saveItem } from 'src/utils/storage';

const langs = {
  en: {
    hi: 'Hi!',
    changeLang: 'Change language',
  },
  es: {
    hi: '¡Hola!',
    changeLang: 'Cambiar lenguaje',
  },
};
const storage = {
  set: saveItem,
  get: getItem,
};

export const { LangProvider, useLang } = createLangProvider(langs, storage);
