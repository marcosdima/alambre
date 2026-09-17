import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Easing, withTiming } from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import type { IconAnimationConfig, IconProps } from 'alambre';
import type { ColorValue } from 'react-native';
import type { ItemIconKey } from './item-types';

export type CatalogIconProps = IconProps & {
  color: ColorValue;
  lineWidth?: number;
  drawIt?: boolean;
  fill?: ColorValue;
  iconAnimation?: IconAnimationConfig;
};

export const catalogDrawAnimation: IconAnimationConfig = {
  drawAnimation: (value: number) => withTiming(value, {
    duration: 520,
    easing: Easing.out(Easing.exp),
  }),
  resetAnimation: (value: number) => withTiming(value, {
    duration: 180,
    easing: Easing.in(Easing.quad),
  }),
};

export const iconCatalog: Record<ItemIconKey, ComponentType<CatalogIconProps>> = {
  keys: AlambreIcons.Keys as ComponentType<CatalogIconProps>,
  wallet: AlambreIcons.Wallet as ComponentType<CatalogIconProps>,
  phone: AlambreIcons.Phone as ComponentType<CatalogIconProps>,
  documents: AlambreIcons.Documents as ComponentType<CatalogIconProps>,
  umbrella: AlambreIcons.Umbrella as ComponentType<CatalogIconProps>,
  water: AlambreIcons.Water as ComponentType<CatalogIconProps>,
  meds: AlambreIcons.Meds as ComponentType<CatalogIconProps>,
  charger: AlambreIcons.Plug as ComponentType<CatalogIconProps>,
  backpack: AlambreIcons.Backpack as ComponentType<CatalogIconProps>,
  laptop: AlambreIcons.Laptop as ComponentType<CatalogIconProps>,
  headphones: AlambreIcons.Headphones as ComponentType<CatalogIconProps>,
  glasses: AlambreIcons.Glasses as ComponentType<CatalogIconProps>,
  book: AlambreIcons.Book as ComponentType<CatalogIconProps>,
  'shopping-bag': AlambreIcons.ShoppingBag as ComponentType<CatalogIconProps>,
  coffee: AlambreIcons.Coffee as ComponentType<CatalogIconProps>,
  watch: AlambreIcons.Watch as ComponentType<CatalogIconProps>,
  gift: AlambreIcons.Gift as ComponentType<CatalogIconProps>,
  'credit-card': AlambreIcons.CreditCard as ComponentType<CatalogIconProps>,
};

type ItemIconProps = CatalogIconProps & { icon: ItemIconKey; delay?: number };

export const ItemIcon = ({ icon, delay = 0, drawIt = true, ...props }: ItemIconProps) => {
  const [ready, setReady] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) return;
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const Component = iconCatalog[icon];
  if (!Component) return null;
  return <Component {...props} drawIt={drawIt && ready} />;
};
