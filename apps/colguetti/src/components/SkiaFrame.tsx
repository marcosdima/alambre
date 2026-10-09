import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Group, vec, DashPathEffect } from '@shopify/react-native-skia';

import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

export default function SkiaFrame({ 
  color = '#000', 
  inset = 8, 
  strokeWidth = 1.5,
  cornerSize = 3,
  cornerGap = 12,
  cornerShape = 'dot',
  rotateCorners = false,
  dashed = false,
}: { 
  color?: string; 
  inset?: number; 
  strokeWidth?: number;
  cornerSize?: number;
  cornerGap?: number;
  cornerShape?: 'dot' | 'square' | 'triangle';
  rotateCorners?: boolean;
  dashed?: boolean;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  const renderCorner = (cx: number, cy: number, angle: number) => {
    let shape;
    if (cornerShape === 'square') {
      const s = cornerSize * 1.5;
      shape = (
        <Path 
          path={`M ${cx - s} ${cy - s} L ${cx + s} ${cy - s} L ${cx + s} ${cy + s} L ${cx - s} ${cy + s} Z`} 
          color={color} 
          style="fill"
        />
      );
    } else if (cornerShape === 'triangle') {
      const s = cornerSize * 1.5;
      shape = (
        <Path 
          path={`M ${cx} ${cy - s} L ${cx + s} ${cy + s} L ${cx - s} ${cy + s} Z`} 
          color={color} 
          style="fill"
        />
      );
    } else {
      shape = <Circle cx={cx} cy={cy} r={cornerSize} color={color} />;
    }

    if (rotateCorners) {
      return (
        <Group key={`corner-${cx}-${cy}`} origin={vec(cx, cy)} transform={[{ rotate: angle }]}>
          {shape}
        </Group>
      );
    }
    
    return <Group key={`corner-${cx}-${cy}`}>{shape}</Group>;
  };

  const renderPath = (d: string) => (
    <Path path={d} color={color} strokeWidth={strokeWidth} style="stroke" end={progress}>
      {dashed && <DashPathEffect intervals={[4, 6]} />}
    </Path>
  );

  return (
    <View 
      style={StyleSheet.absoluteFill} 
      pointerEvents="none" 
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {size.width > 0 && size.height > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Top Line */}
          {renderPath(`M ${inset + cornerGap} ${inset} L ${size.width - inset - cornerGap} ${inset}`)}
          {/* Bottom Line */}
          {renderPath(`M ${size.width - inset - cornerGap} ${size.height - inset} L ${inset + cornerGap} ${size.height - inset}`)}
          {/* Left Line */}
          {renderPath(`M ${inset} ${size.height - inset - cornerGap} L ${inset} ${inset + cornerGap}`)}
          {/* Right Line */}
          {renderPath(`M ${size.width - inset} ${inset + cornerGap} L ${size.width - inset} ${size.height - inset - cornerGap}`)}
          
          {/* Corners */}
          {renderCorner(inset, inset, -Math.PI / 4)}
          {renderCorner(size.width - inset, inset, Math.PI / 4)}
          {renderCorner(inset, size.height - inset, -3 * Math.PI / 4)}
          {renderCorner(size.width - inset, size.height - inset, 3 * Math.PI / 4)}
        </Canvas>
      )}
    </View>
  );
}
