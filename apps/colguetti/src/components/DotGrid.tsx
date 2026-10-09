import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Points, vec } from '@shopify/react-native-skia';

export default function DotGrid({ color, spacing = 24, radius = 1.5, opacity = 1 }: { color: string; spacing?: number; radius?: number; opacity?: number }) {
  const { width, height } = useWindowDimensions();

  const points = useMemo(() => {
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const arr = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        arr.push(vec(i * spacing, j * spacing));
      }
    }
    return arr;
  }, [width, height, spacing]);

  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Points points={points} mode="points" color={color} strokeWidth={radius * 2} strokeCap="round" />
      </Canvas>
    </View>
  );
}
