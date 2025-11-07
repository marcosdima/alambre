import { useConfig } from './config';
import { Text } from '@base';
import { Button } from "react-native";

const keyOf = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};
export default ({ val }: { val: any }) => {
    const { config, saveField } = useConfig();
		console.log(config)
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
}