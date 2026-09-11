import type { CircleProps } from 'react-native-svg';
import Svg from 'react-native-svg';
import { svgBaseConfig } from './utils';
import type { IconstTypes } from '../../types';
import { View } from '../base';
import Circle from './base/Circle';

const circle: CircleProps = {
  cx: 50,
  cy: 50,
  r: 35,
  stroke: 'black',
  fillOpacity: 0,
  strokeWidth: 3,
};

const getRandomInt = (n: number) => Math.floor(Math.random() * n);

export default ({ drawIt, iconAnimation, ...props } : IconstTypes.BaseIcon) => {
  const bigCircleCofig = {
    circle: {
      ...circle,
      fillOpacity: !drawIt ? 0 : 1,
      fill: 'gray',
    },
    drawIt,
    iconAnimation,
    strokeOffset: 25,
  };

  const completeCircle = {
    circle,
    drawIt,
    rotation: 279,
    iconAnimation,
    strokeOffset: 80,
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
              drawIt={drawIt}
              strokeOffset={
                (getRandomInt(2) % 2 === 0)
                  ? 0
                  : getRandomInt(10) + 10
              }
              iconAnimation={iconAnimation}
            />
          ))
        }
      </Svg>
    </View>
  );
};
