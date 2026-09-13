import { createLangProvider } from 'alambre';
import { getItem, saveItem } from '../utils/storage';

const langs = {
  es: {
    common: {
      back: 'Volver',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
    home: {
      title: 'Colguetti',
      subtitle: 'No te olvides nada al salir de casa.',
      noNextAlarms: 'Sin alarmas próximas.',
      leaveNow: 'Me voy',
      guideItems: 'Mis ítems',
      guideAlarms: 'Alarmas',
      guideSettings: 'Ajustes',
    },
    items: {
      title: 'Mis ítems',
      empty: 'Todavía no agregaste ítems para recordar.',
      addTitle: 'Nuevo ítem',
      editTitle: 'Editar ítem',
      nameLabel: 'Nombre',
      namePlaceholder: 'Ej.: llaves',
      colorLabel: 'Color',
      iconLabel: 'Ícono',
      add: 'Agregar',
      delete: 'Borrar',
    },
    alarms: {
      title: 'Alarmas',
      empty: 'Todavía no hay alarmas.',
    },
    settings: {
      title: 'Ajustes',
      language: 'Idioma',
      theme: 'Tema',
    },
  },
  en: {
    common: {
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
    },
    home: {
      title: 'Colguetti',
      subtitle: 'Don\'t forget anything when leaving home.',
      noNextAlarms: 'No upcoming alarms.',
      leaveNow: 'I\'m leaving',
      guideItems: 'My items',
      guideAlarms: 'Alarms',
      guideSettings: 'Settings',
    },
    items: {
      title: 'My items',
      empty: 'You have not added any items to remember yet.',
      addTitle: 'New item',
      editTitle: 'Edit item',
      nameLabel: 'Name',
      namePlaceholder: 'E.g.: keys',
      colorLabel: 'Color',
      iconLabel: 'Icon',
      add: 'Add',
      delete: 'Delete',
    },
    alarms: {
      title: 'Alarms',
      empty: 'There are no alarms yet.',
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
    },
  },
};

const storage = {
  set: saveItem,
  get: getItem,
};

export const { LangProvider, useLang } = createLangProvider(langs, storage);
