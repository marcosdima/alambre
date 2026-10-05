export const itemIconKeys = [
  'keys',
  'wallet',
  'phone',
  'documents',
  'umbrella',
  'water',
  'meds',
  'charger',
  'backpack',
  'laptop',
  'headphones',
  'glasses',
  'book',
  'shopping-bag',
  'coffee',
  'watch',
  'gift',
  'credit-card',
  'moon',
  'arrow',
  'sun',
  'cross',
  'tick',
  'heart',
  'undo',
  'redo',
  'refresh',
  'trophy',
  'play',
  'gear',
  'zap',
  'leaf',
  'alert',
  'circle-check',
  'circle-x',
  'plug',
  'eye',
  'eye-off',
  'search',
  'trash',
] as const;

export type ItemIconKey = (typeof itemIconKeys)[number];

export type Item = {
  id: string;
  name: string;
  color: string;
  icon: ItemIconKey;
};

export type ItemInput = Omit<Item, 'id'>;
