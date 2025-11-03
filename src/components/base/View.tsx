import { View } from "react-native";
import { ViewProps } from "../../types/default-react";

export default ({ children, ...props }: ViewProps) => {
  return (
    <View
      {...props}
    >
        {children}
    </View>
  )
}