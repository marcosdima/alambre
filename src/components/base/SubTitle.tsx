import Text from "./Text";
import { TextProps } from "../../types/default-react";

export default ({ style, ...props }: TextProps) => {
  return (
    <Text
      style={[
        {
          fontSize: 18,
          opacity: 0.8,
          marginBottom: 6,
        },
        style,
      ]}
      {...props}
    />
  );
};
