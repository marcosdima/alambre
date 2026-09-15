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
      {circle({ cx: 55, cy: 50, r: 15 }, s, drawIt)}
      {line({ x1: 70, y1: 50, x2: 150, y2: 50 }, s, drawIt)}
      {line({ x1: 116, y1: 50, x2: 116, y2: 70 }, s, drawIt)}
      {line({ x1: 138, y1: 50, x2: 138, y2: 62 }, s, drawIt)}
    </>
  )),

  wallet: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 28, y1: 38, x2: 172, y2: 38 }, s, drawIt)}
      {line({ x1: 172, y1: 38, x2: 172, y2: 74 }, s, drawIt)}
      {line({ x1: 172, y1: 74, x2: 28, y2: 74 }, s, drawIt)}
      {line({ x1: 28, y1: 74, x2: 28, y2: 38 }, s, drawIt)}
      {line({ x1: 28, y1: 50, x2: 172, y2: 50 }, s, drawIt)}
      {line({ x1: 96, y1: 50, x2: 96, y2: 74 }, s, drawIt)}
      {line({ x1: 40, y1: 61, x2: 88, y2: 61 }, s, drawIt)}
    </>
  )),

  phone: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 58, y1: 26, x2: 142, y2: 26 }, s, drawIt)}
      {line({ x1: 142, y1: 26, x2: 142, y2: 74 }, s, drawIt)}
      {line({ x1: 142, y1: 74, x2: 58, y2: 74 }, s, drawIt)}
      {line({ x1: 58, y1: 74, x2: 58, y2: 26 }, s, drawIt)}
      {line({ x1: 92, y1: 67, x2: 108, y2: 67 }, s, drawIt)}
    </>
  )),

  documents: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 52, y1: 24, x2: 128, y2: 24 }, s, drawIt)}
      {line({ x1: 52, y1: 24, x2: 52, y2: 60 }, s, drawIt)}
      {line({ x1: 60, y1: 34, x2: 140, y2: 34 }, s, drawIt)}
      {line({ x1: 140, y1: 34, x2: 140, y2: 78 }, s, drawIt)}
      {line({ x1: 60, y1: 78, x2: 140, y2: 78 }, s, drawIt)}
      {line({ x1: 60, y1: 78, x2: 60, y2: 34 }, s, drawIt)}
      {line({ x1: 70, y1: 52, x2: 130, y2: 52 }, s, drawIt)}
    </>
  )),

  umbrella: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 58, y1: 62, x2: 70, y2: 48 }, s, drawIt)}
      {line({ x1: 70, y1: 48, x2: 85, y2: 40 }, s, drawIt)}
      {line({ x1: 85, y1: 40, x2: 100, y2: 38 }, s, drawIt)}
      {line({ x1: 100, y1: 38, x2: 115, y2: 40 }, s, drawIt)}
      {line({ x1: 115, y1: 40, x2: 130, y2: 48 }, s, drawIt)}
      {line({ x1: 130, y1: 48, x2: 142, y2: 62 }, s, drawIt)}
      {line({ x1: 100, y1: 62, x2: 100, y2: 86 }, s, drawIt)}
      {line({ x1: 100, y1: 86, x2: 84, y2: 86 }, s, drawIt)}
      {line({ x1: 84, y1: 86, x2: 84, y2: 78 }, s, drawIt)}
    </>
  )),

  water: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 100, cy: 27, r: 7 }, s, drawIt)}
      {line({ x1: 91, y1: 34, x2: 86, y2: 44 }, s, drawIt)}
      {line({ x1: 109, y1: 34, x2: 114, y2: 44 }, s, drawIt)}
      {line({ x1: 86, y1: 44, x2: 86, y2: 78 }, s, drawIt)}
      {line({ x1: 114, y1: 44, x2: 114, y2: 78 }, s, drawIt)}
      {line({ x1: 86, y1: 78, x2: 114, y2: 78 }, s, drawIt)}
      {line({ x1: 90, y1: 59, x2: 110, y2: 59 }, s, drawIt)}
    </>
  )),

  meds: makeIcon((s, drawIt) => (
    <>
      {circle({ cx: 72, cy: 50, r: 15 }, s, drawIt)}
      {circle({ cx: 128, cy: 50, r: 15 }, s, drawIt)}
      {line({ x1: 72, y1: 43, x2: 72, y2: 57 }, s, drawIt)}
      {line({ x1: 128, y1: 43, x2: 128, y2: 57 }, s, drawIt)}
    </>
  )),

  charger: makeIcon((s, drawIt) => (
    <>
      {line({ x1: 70, y1: 32, x2: 130, y2: 32 }, s, drawIt)}
      {line({ x1: 130, y1: 32, x2: 130, y2: 52 }, s, drawIt)}
      {line({ x1: 70, y1: 52, x2: 130, y2: 52 }, s, drawIt)}
      {line({ x1: 70, y1: 52, x2: 70, y2: 32 }, s, drawIt)}
      {line({ x1: 88, y1: 52, x2: 88, y2: 72 }, s, drawIt)}
      {line({ x1: 112, y1: 52, x2: 112, y2: 72 }, s, drawIt)}
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
      {line({ x1: 56, y1: 56, x2: 100, y2: 56 }, s, drawIt)}
    </>
  )),
};

export const ItemIcon = ({ icon, ...props }: CatalogIconProps & { icon: ItemIconKey }) => {
  const Component = iconCatalog[icon];
  return <Component {...props} />;
};
