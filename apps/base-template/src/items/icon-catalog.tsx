import type { ReactNode } from 'react';
import type { CircleProps, LineProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import { AlambreIcons } from 'alambre';
import type { ItemIconKey } from './item-types';

export type CatalogIconProps = {
  color: string;
  lineWidth?: number;
  drawIt?: boolean;
};

type PrimitiveProps = Partial<CircleProps> & Partial<LineProps>;

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

const makeIcon = (elements: (stroke: PrimitiveProps, drawIt: boolean) => ReactNode) => (
  ({ color, lineWidth = 6, drawIt = true }: CatalogIconProps) => {
    const stroke: PrimitiveProps = { stroke: color, strokeWidth: lineWidth };
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
      {circle({ cx: 52, cy: 50, r: 16 }, s, drawIt)}
      {line({ x1: 68, y1: 50, x2: 144, y2: 50 }, s, drawIt)}
      {line({ x1: 130, y1: 56, x2: 130, y2: 74 }, s, drawIt)}
      {line({ x1: 138, y1: 55, x2: 138, y2: 70 }, s, drawIt)}
    </>
  )),

  wallet: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 30, y1: 44, x2: 170, y2: 44 }, s, drawIt)}
      {line({ x1: 30, y1: 62, x2: 170, y2: 62 }, s, drawIt)}
      {line({ x1: 30, y1: 44, x2: 30, y2: 62 }, s, drawIt)}
      {line({ x1: 170, y1: 44, x2: 170, y2: 62 }, s, drawIt)}
      {line({ x1: 108, y1: 44, x2: 108, y2: 62 }, s, drawIt)}
    </>
  )),

  phone: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 58, y1: 26, x2: 142, y2: 26 }, s, drawIt)}
      {line({ x1: 142, y1: 26, x2: 142, y2: 74 }, s, drawIt)}
      {line({ x1: 58, y1: 74, x2: 142, y2: 74 }, s, drawIt)}
      {line({ x1: 58, y1: 26, x2: 58, y2: 74 }, s, drawIt)}
    </>
  )),

  documents: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 58, y1: 30, x2: 96, y2: 30 }, s, drawIt)}
      {line({ x1: 96, y1: 30, x2: 96, y2: 78 }, s, drawIt)}
      {line({ x1: 58, y1: 78, x2: 96, y2: 78 }, s, drawIt)}
      {line({ x1: 58, y1: 30, x2: 58, y2: 78 }, s, drawIt)}
      {line({ x1: 84, y1: 18, x2: 128, y2: 18 }, s, drawIt)}
      {line({ x1: 128, y1: 18, x2: 128, y2: 66 }, s, drawIt)}
      {line({ x1: 84, y1: 66, x2: 128, y2: 66 }, s, drawIt)}
      {line({ x1: 84, y1: 18, x2: 84, y2: 66 }, s, drawIt)}
    </>
  )),

  umbrella: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 74, y1: 62, x2: 126, y2: 62 }, s, drawIt)}
      {line({ x1: 74, y1: 62, x2: 100, y2: 36 }, s, drawIt)}
      {line({ x1: 100, y1: 36, x2: 126, y2: 62 }, s, drawIt)}
      {line({ x1: 100, y1: 62, x2: 100, y2: 84 }, s, drawIt)}
      {line({ x1: 100, y1: 84, x2: 84, y2: 84 }, s, drawIt)}
    </>
  )),

  water: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 100, cy: 30, r: 9 }, s, drawIt)}
      {line({ x1: 91, y1: 39, x2: 88, y2: 50 }, s, drawIt)}
      {line({ x1: 109, y1: 39, x2: 112, y2: 50 }, s, drawIt)}
      {line({ x1: 88, y1: 50, x2: 112, y2: 50 }, s, drawIt)}
      {line({ x1: 88, y1: 78, x2: 112, y2: 78 }, s, drawIt)}
      {line({ x1: 88, y1: 50, x2: 88, y2: 78 }, s, drawIt)}
      {line({ x1: 112, y1: 50, x2: 112, y2: 78 }, s, drawIt)}
    </>
  )),

  meds: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 75, cy: 50, r: 13 }, s, drawIt)}
      {circle({ cx: 125, cy: 50, r: 13 }, s, drawIt)}
      {line({ x1: 75, y1: 37, x2: 125, y2: 37 }, s, drawIt)}
      {line({ x1: 75, y1: 63, x2: 125, y2: 63 }, s, drawIt)}
    </>
  )),

  charger: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 70, y1: 38, x2: 130, y2: 38 }, s, drawIt)}
      {line({ x1: 130, y1: 38, x2: 130, y2: 58 }, s, drawIt)}
      {line({ x1: 70, y1: 58, x2: 130, y2: 58 }, s, drawIt)}
      {line({ x1: 70, y1: 38, x2: 70, y2: 58 }, s, drawIt)}
      {line({ x1: 130, y1: 46, x2: 152, y2: 46 }, s, drawIt)}
      {line({ x1: 130, y1: 54, x2: 152, y2: 54 }, s, drawIt)}
    </>
  )),

  backpack: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 88, y1: 24, x2: 112, y2: 24 }, s, drawIt)}
      {line({ x1: 56, y1: 40, x2: 144, y2: 40 }, s, drawIt)}
      {line({ x1: 56, y1: 40, x2: 56, y2: 78 }, s, drawIt)}
      {line({ x1: 144, y1: 40, x2: 144, y2: 78 }, s, drawIt)}
      {line({ x1: 56, y1: 78, x2: 144, y2: 78 }, s, drawIt)}
      {line({ x1: 100, y1: 40, x2: 100, y2: 78 }, s, drawIt)}
    </>
  )),
};

export const ItemIcon = ({ icon, ...props }: CatalogIconProps & { icon: ItemIconKey }) => {
  const Component = iconCatalog[icon];
  return <Component {...props} />;
};
