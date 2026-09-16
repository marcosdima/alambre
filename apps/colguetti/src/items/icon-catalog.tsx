import type { ReactNode } from 'react';
import type { CircleProps, LineProps, PathProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import { AlambreIcons } from 'alambre';
import type { ItemIconKey } from './item-types';

export type CatalogIconProps = {
  color: string;
  lineWidth?: number;
  drawIt?: boolean;
};

type PrimitiveProps = Partial<CircleProps> & Partial<LineProps> & Partial<PathProps>;

const circle = (c: CircleProps, stroke: PrimitiveProps, drawIt: boolean) => (
  <AlambreIcons.Circle
    key={`c-${c.cx}-${c.cy}-${c.r}`}
    circle={{ ...c, ...stroke }}
    drawIt={drawIt}
  />
);

const line = (l: LineProps, stroke: PrimitiveProps, drawIt: boolean) => (
  <AlambreIcons.Line
    key={`l-${l.x1}-${l.y1}-${l.x2}-${l.y2}`}
    line={{ ...l, ...stroke }}
    drawIt={drawIt}
  />
);

const path = (d: string, stroke: PrimitiveProps, drawIt: boolean) => (
  <AlambreIcons.Path
    key={`p-${d}`}
    path={{ d, ...stroke }}
    drawIt={drawIt}
  />
);

const makeIcon = (elements: (stroke: PrimitiveProps, drawIt: boolean) => ReactNode) => (
  ({ color, lineWidth = 5, drawIt = true }: CatalogIconProps) => {
    const stroke: PrimitiveProps = {
      stroke: color,
      strokeWidth: lineWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    return (
      <Svg height="100%" width="100%" viewBox="0 0 200 100">
        {elements(stroke, drawIt)}
      </Svg>
    );
  }
);

export const iconCatalog: Record<ItemIconKey, (props: CatalogIconProps) => ReactNode> = {
  keys: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 38, cy: 26, r: 11 }, s, drawIt)}
      {line({ x1: 47, y1: 34, x2: 66, y2: 53 }, s, drawIt)}
      {circle({ cx: 70, cy: 56, r: 7 }, s, drawIt)}
      {circle({ cx: 70, cy: 56, r: 3 }, s, drawIt)}
      {path('M 77 56 H 120 L 120 62 L 112 62 L 112 68 L 120 68 L 120 74 L 110 74 L 110 80 L 116 80 L 116 84 L 77 84', s, drawIt)}
    </>
  )),

  wallet: makeIcon((s, drawIt) => (
    <>
      {path('M 58 35 H 142 A 8 8 0 0 1 150 43 V 67 A 8 8 0 0 1 142 75 H 58 A 8 8 0 0 1 50 67 V 43 A 8 8 0 0 1 58 35 Z', s, drawIt)}
      {line({ x1: 50, y1: 55, x2: 150, y2: 55 }, s, drawIt)}
      {path('M 63 24 H 104 A 6 6 0 0 1 110 30 V 34 A 6 6 0 0 1 104 40 H 63 A 6 6 0 0 1 57 34 V 30 A 6 6 0 0 1 63 24 Z', s, drawIt)}
      {line({ x1: 62, y1: 32, x2: 105, y2: 32 }, s, drawIt)}
    </>
  )),

  phone: makeIcon((s, drawIt) => (
    <>
      {path('M 74 20 H 126 A 14 14 0 0 1 140 34 V 66 A 14 14 0 0 1 126 80 H 74 A 14 14 0 0 1 60 66 V 34 A 14 14 0 0 1 74 20 Z', s, drawIt)}
      {path('M 76 26 H 124 A 8 8 0 0 1 132 34 V 66 A 8 8 0 0 1 124 74 H 76 A 8 8 0 0 1 68 66 V 34 A 8 8 0 0 1 76 26 Z', s, drawIt)}
      {circle({ cx: 100, cy: 32, r: 3 }, s, drawIt)}
      {line({ x1: 86, y1: 72, x2: 114, y2: 72 }, s, drawIt)}
    </>
  )),

  documents: makeIcon((s, drawIt) => (
    <>
      {path('M 60 30 H 128 L 140 42 V 82 H 60 V 30 Z', s, drawIt)}
      {line({ x1: 68, y1: 46, x2: 132, y2: 46 }, s, drawIt)}
      {line({ x1: 68, y1: 56, x2: 124, y2: 56 }, s, drawIt)}
      {line({ x1: 68, y1: 66, x2: 128, y2: 66 }, s, drawIt)}
      {path('M 120 68 H 132 A 4 4 0 0 1 136 72 V 74 A 4 4 0 0 1 132 78 H 120 A 4 4 0 0 1 116 74 V 72 A 4 4 0 0 1 120 68 Z', s, drawIt)}
    </>
  )),

  umbrella: makeIcon((s, drawIt) => (
    <>
      {path('M 52 62 A 48 48 0 0 1 148 62', s, drawIt)}
      {line({ x1: 100, y1: 14, x2: 100, y2: 6 }, s, drawIt)}
      {line({ x1: 100, y1: 62, x2: 100, y2: 82 }, s, drawIt)}
      {path('M 100 82 L 100 90 A 12 12 0 0 1 118 90', s, drawIt)}
    </>
  )),

  water: makeIcon((s, drawIt) => (
    <>
      {path('M 90 20 H 110 A 4 4 0 0 1 114 24 V 30 A 4 4 0 0 1 110 34 H 90 A 4 4 0 0 1 86 30 V 24 A 4 4 0 0 1 90 20 Z', s, drawIt)}
      {path('M 94 34 L 94 42 L 84 46 L 84 76 A 8 8 0 0 0 92 84 H 108 A 8 8 0 0 0 116 76 L 116 46 L 106 42 L 106 34 Z', s, drawIt)}
      {path('M 100 52 Q 106 58 106 62 A 6 6 0 1 1 94 62 Q 94 58 100 52 Z', s, drawIt)}
      {line({ x1: 88, y1: 66, x2: 112, y2: 66 }, s, drawIt)}
      {line({ x1: 88, y1: 72, x2: 112, y2: 72 }, s, drawIt)}
    </>
  )),

  meds: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 46, cy: 42, r: 4 }, s, drawIt)}
      {path('M 44 50 L 60 52 L 58 74 Q 57 82 50 82 L 44 80 Q 42 72 44 50 Z', s, drawIt)}
      {path('M 88 56 H 118 A 7 7 0 0 1 125 63 A 7 7 0 0 1 118 70 H 88 A 7 7 0 0 1 81 63 A 7 7 0 0 1 88 56 Z', s, drawIt)}
      {line({ x1: 103, y1: 56, x2: 103, y2: 70 }, s, drawIt)}
      {circle({ cx: 152, cy: 44, r: 9 }, s, drawIt)}
      {line({ x1: 152, y1: 35, x2: 152, y2: 53 }, s, drawIt)}
    </>
  )),

  charger: makeIcon((s, drawIt) => (
    <>
      {path('M 78 30 H 122 A 6 6 0 0 1 128 36 V 52 A 6 6 0 0 1 122 58 H 78 A 6 6 0 0 1 72 52 V 36 A 6 6 0 0 1 78 30 Z', s, drawIt)}
      {line({ x1: 88, y1: 30, x2: 88, y2: 22 }, s, drawIt)}
      {line({ x1: 112, y1: 30, x2: 112, y2: 22 }, s, drawIt)}
      {path('M 100 58 Q 116 66 129 71', s, drawIt)}
      {path('M 132 64 H 146 A 6 6 0 0 1 152 70 V 78 A 6 6 0 0 1 146 84 H 132 A 6 6 0 0 1 126 78 V 70 A 6 6 0 0 1 132 64 Z', s, drawIt)}
    </>
  )),

  backpack: makeIcon((s, drawIt) => (
    <>
      {path('M 72 70 L 72 52 Q 72 26 100 26 Q 128 26 128 52 L 128 70 H 72 Z', s, drawIt)}
      {path('M 92 26 Q 100 13 108 26', s, drawIt)}
      {path('M 88 42 H 112 Q 116 42 116 46 V 58 Q 116 62 112 62 H 88 Q 84 62 84 58 V 46 Q 84 42 88 42 Z', s, drawIt)}
      {line({ x1: 84, y1: 52, x2: 116, y2: 52 }, s, drawIt)}
      {line({ x1: 72, y1: 40, x2: 62, y2: 56 }, s, drawIt)}
      {line({ x1: 128, y1: 40, x2: 138, y2: 56 }, s, drawIt)}
    </>
  )),
};

export const ItemIcon = ({ icon, ...props }: CatalogIconProps & { icon: ItemIconKey }) => {
  const Component = iconCatalog[icon];
  return <Component {...props} />;
};
