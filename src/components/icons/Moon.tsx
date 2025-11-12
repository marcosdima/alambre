import type { CircleProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import { svgBaseConfig } from './utils';
import type { DefaultReact } from '../../types';
import { View } from '../base';
import Circle from './base/Circle';

const circle: CircleProps = {
  cx: 50,
  cy: 50,
  r: 35,
  stroke: 'black',
  fillOpacity: 0,
  strokeWidth: 3,
  strokeDashoffset: 100,
};

type SunProps = DefaultReact.ViewProps & {
  reset: boolean;
}

const getRandomInt = (n: number) => Math.floor(Math.random() * n);

export default ({ reset, ...props } : SunProps) => {
  const bigCircleCofig = {
    circle: {
      ...circle,
      fillOpacity: reset ? 0 : 1,
      fill: 'gray',
    },
    reset,
    strokeOffset: 25,
  };

  const completeCircle = {
    circle,
    reset,
    strokeOffset: 80,
    rotation: 279,
  };

  const smallCircles = [
    { cx: 45, cy: 70, r: 5 },
    { cx: 30, cy: 60, r: 3 },
    { cx: 43, cy: 35, r: 5 },
    { cx: 70, cy: 50, r: 5 },
  ];

  return (
    <View {...props}>
      <Svg {...svgBaseConfig}>
        <Circle {...bigCircleCofig} />
        <Circle {...completeCircle} />
        {
          smallCircles.map((c,i) => (
            <Circle
              key={i}
              circle={{ ...circle, ...c }}
              reset={reset}
              strokeOffset={
                (getRandomInt(2) % 2 === 0)
                  ? 0
                  : getRandomInt(10) + 10
              }
            />
          ))
        }
      </Svg>
    </View>
  );
};
