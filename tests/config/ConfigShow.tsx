import { useConfig } from './config';
import { Text } from 'src/components/base';
import { Button } from 'react-native';

const keyOf = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};
export default ({ val }: { val: never }) => {
  const { config, saveField } = useConfig();
  return (
    <>
      <>
        {
          keyOf(config).map((k, i) => (
            <Text key={i}>{k}: {config[k] ?? ''}</Text>
          ))
        }

      </>
      <Button title="Change" onPress={() => saveField('alias', `${val}`)} />
    </>
  );
};
