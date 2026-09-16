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
] as const;

export type ItemIconKey = (typeof itemIconKeys)[number];

export type Item = {
  id: string;
  name: string;
  color: string;
  icon: ItemIconKey;
};

export type ItemInput = Omit<Item, 'id'>;
