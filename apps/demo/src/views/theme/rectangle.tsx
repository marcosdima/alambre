import { Text, View } from 'alambre';
import { Button } from 'react-native';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';

export default () => {
  const { theme, toggleTheme } = useLightDark();
  const { config } = useConfig();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={theme}>
        {config.alias}
      </Text>
      <Text style={theme}>
        {config.batteryOptions}
      </Text>
      <Button title="Change" onPress={toggleTheme} />
    </View>
  );
};
