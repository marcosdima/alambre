import type { ComponentProps } from 'react';
import { Text } from 'react-native';

export default function AppTitle({ style, ...props }: ComponentProps<typeof Text>) {
  return (
    <Text
      style={[
        {
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 8,
        },
        style,
      ]}
      {...props}
    />
  );
}
