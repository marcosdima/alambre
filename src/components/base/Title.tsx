import Text from './Text';
import type { TextProps } from '../../types/default-react';

export default ({ style, ...props }: TextProps) => {
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
};
