import { StyleSheet, Text, View } from 'react-native';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';

export default function PuzzleCreator() {
  const { theme } = useLightDark();
  const { lang } = useLang();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.muted }]}>
        {lang.home.creator}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});
