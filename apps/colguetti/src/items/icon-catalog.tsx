import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CircleProps, LineProps, PathProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import { Easing, withTiming } from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import type { IconAnimationConfig } from 'alambre';
import type { ItemIconKey } from './item-types';

export type CatalogIconProps = {
  color: string;
  lineWidth?: number;
  drawIt?: boolean;
  iconAnimation?: IconAnimationConfig;
};

type PrimitiveProps = Partial<CircleProps> & Partial<LineProps> & Partial<PathProps>;

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

const circle = (c: CircleProps, stroke: PrimitiveProps, drawIt: boolean, iconAnimation?: IconAnimationConfig) => (
  <AlambreIcons.Circle
    key={`c-${c.cx}-${c.cy}-${c.r}`}
    circle={{ ...c, ...stroke }}
    drawIt={drawIt}
    iconAnimation={iconAnimation}
  />
);

const line = (l: LineProps, stroke: PrimitiveProps, drawIt: boolean, iconAnimation?: IconAnimationConfig) => (
  <AlambreIcons.Line
    key={`l-${l.x1}-${l.y1}-${l.x2}-${l.y2}`}
    line={{ ...l, ...stroke }}
    drawIt={drawIt}
    iconAnimation={iconAnimation}
  />
);

const path = (d: string, stroke: PrimitiveProps, drawIt: boolean, iconAnimation?: IconAnimationConfig) => (
  <AlambreIcons.Path
    key={`p-${d}`}
    path={{ d, ...stroke }}
    drawIt={drawIt}
    iconAnimation={iconAnimation}
  />
);

const makeIcon = (elements: (s: PrimitiveProps, drawIt: boolean, anim?: IconAnimationConfig) => ReactNode) => (
  ({ color, lineWidth = 2, drawIt = true, iconAnimation }: CatalogIconProps) => {
    const stroke: PrimitiveProps = {
      stroke: color,
      strokeWidth: lineWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    return (
      <Svg height="100%" width="100%" viewBox="0 0 24 24">
        {elements(stroke, drawIt, iconAnimation)}
      </Svg>
    );
  }
);

export const iconCatalog: Record<ItemIconKey, (props: CatalogIconProps) => ReactNode> = {
  keys: makeIcon((s, drawIt, anim) => (
    <>
      {path('M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z', s, drawIt, anim)}
    </>
  )),

  wallet: makeIcon((s, drawIt, anim) => (
    <>
      {path('M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', s, drawIt, anim)}
      {path('M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', s, drawIt, anim)}
    </>
  )),

  phone: makeIcon((s, drawIt, anim) => (
    <>
      {path('M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', s, drawIt, anim)}
      {line({ x1: 11.7, y1: 18, x2: 12.3, y2: 18 }, s, drawIt, anim)}
    </>
  )),

  documents: makeIcon((s, drawIt, anim) => (
    <>
      {path('M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z', s, drawIt, anim)}
      {path('M14 2v5a1 1 0 0 0 1 1h5', s, drawIt, anim)}
      {path('M16 13H8', s, drawIt, anim)}
      {path('M16 17H8', s, drawIt, anim)}
      {path('M10 9H8', s, drawIt, anim)}
    </>
  )),

  umbrella: makeIcon((s, drawIt, anim) => (
    <>
      {path('M12 13v7a2 2 0 0 0 4 0', s, drawIt, anim)}
      {path('M12 2v2', s, drawIt, anim)}
      {path('M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z', s, drawIt, anim)}
    </>
  )),

  water: makeIcon((s, drawIt, anim) => (
    <>
      {path('M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z', s, drawIt, anim)}
      {path('M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0', s, drawIt, anim)}
    </>
  )),

  meds: makeIcon((s, drawIt, anim) => (
    <>
      {path('m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z', s, drawIt, anim)}
      {path('m8.5 8.5 7 7', s, drawIt, anim)}
    </>
  )),

  charger: makeIcon((s, drawIt, anim) => (
    <>
      {path('m11 7-3 5h4l-3 5', s, drawIt, anim)}
      {path('M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935', s, drawIt, anim)}
      {path('M22 14v-4', s, drawIt, anim)}
      {path('M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936', s, drawIt, anim)}
    </>
  )),

  backpack: makeIcon((s, drawIt, anim) => (
    <>
      {path('M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', s, drawIt, anim)}
      {path('M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6', s, drawIt, anim)}
      {path('M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2', s, drawIt, anim)}
      {path('M8 10h8', s, drawIt, anim)}
      {path('M8 18h8', s, drawIt, anim)}
    </>
  )),

  laptop: makeIcon((s, drawIt, anim) => (
    <>
      {path('M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z', s, drawIt, anim)}
      {path('M20.054 15.987H3.946', s, drawIt, anim)}
    </>
  )),

  headphones: makeIcon((s, drawIt, anim) => (
    <>
      {path('M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3', s, drawIt, anim)}
    </>
  )),

  glasses: makeIcon((s, drawIt, anim) => (
    <>
      {circle({ cx: 6, cy: 15, r: 4 }, s, drawIt, anim)}
      {circle({ cx: 18, cy: 15, r: 4 }, s, drawIt, anim)}
      {path('M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2', s, drawIt, anim)}
      {path('M2.5 13 5 7c.7-1.3 1.4-2 3-2', s, drawIt, anim)}
      {path('M21.5 13 19 7c-.7-1.3-1.5-2-3-2', s, drawIt, anim)}
    </>
  )),

  book: makeIcon((s, drawIt, anim) => (
    <>
      {path('M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20', s, drawIt, anim)}
    </>
  )),

  'shopping-bag': makeIcon((s, drawIt, anim) => (
    <>
      {path('M16 10a4 4 0 0 1-8 0', s, drawIt, anim)}
      {path('M3.103 6.034h17.794', s, drawIt, anim)}
      {path('M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z', s, drawIt, anim)}
    </>
  )),

  coffee: makeIcon((s, drawIt, anim) => (
    <>
      {path('M10 2v2', s, drawIt, anim)}
      {path('M14 2v2', s, drawIt, anim)}
      {path('M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1', s, drawIt, anim)}
      {path('M6 2v2', s, drawIt, anim)}
    </>
  )),

  watch: makeIcon((s, drawIt, anim) => (
    <>
      {path('M12 10v2.2l1.6 1', s, drawIt, anim)}
      {path('m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05', s, drawIt, anim)}
      {path('m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05', s, drawIt, anim)}
      {circle({ cx: 12, cy: 12, r: 6 }, s, drawIt, anim)}
    </>
  )),

  gift: makeIcon((s, drawIt, anim) => (
    <>
      {path('M12 7v14', s, drawIt, anim)}
      {path('M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8', s, drawIt, anim)}
      {path('M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5', s, drawIt, anim)}
      {path('M4 7h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z', s, drawIt, anim)}
    </>
  )),

  'credit-card': makeIcon((s, drawIt, anim) => (
    <>
      {path('M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', s, drawIt, anim)}
      {line({ x1: 2, y1: 10, x2: 22, y2: 10 }, s, drawIt, anim)}
      {line({ x1: 6, y1: 14, x2: 8, y2: 14 }, s, drawIt, anim)}
    </>
  )),
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
  return <Component {...props} drawIt={drawIt && ready} />;
};
