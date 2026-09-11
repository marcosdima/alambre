import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, Title, View } from 'alambre';
import {
  apiRouteOptions,
  type ApiRouteKey,
  useExecuteRoute,
} from '../../providers/api';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import ResponseShow from './ResponseShow';


export default () => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<ApiRouteKey>('usersList');
  const { theme } = useLightDark();
  const { lang } = useLang();
  const executeRoute = useExecuteRoute();

  const selectedRoutePath = useMemo(() => {
    const option = apiRouteOptions.find((route) => route.key === selectedRouteKey);
    return option?.path ?? '/users';
  }, [selectedRouteKey]);

  const statusText = executeRoute.isPending
    ? lang.api.loadingRoute
    : executeRoute.error
      ? `Error: ${executeRoute.error.message}`
      : `${lang.api.selectedRoute}: ${selectedRoutePath}`;

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Title style={[styles.title, { color: theme.color }]}>{lang.api.title}</Title>
      <Text style={[styles.status, { color: theme.muted }]}>{statusText}</Text>

      <View style={styles.routesRow}>
        {apiRouteOptions.map((route) => {
          const active = route.key === selectedRouteKey;
          return (
            <Pressable
              key={route.key}
              style={[
                styles.routeChip,
                {
                  backgroundColor: active ? theme.primary : theme.surfaceAlt,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedRouteKey(route.key)}
            >
              <Text style={[styles.routeChipLabel, { color: active ? theme.onPrimary : theme.color }]}>{route.path}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.runButton, { backgroundColor: theme.primary }]}
        onPress={() => executeRoute.mutate({ routeKey: selectedRouteKey })}
      >
        <Text style={[styles.runButtonLabel, { color: theme.onPrimary }]}>{lang.api.executeRoute}</Text>
      </Pressable>

      <View style={[styles.responsePanel, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
        <Text style={[styles.responseTitle, { color: theme.color }]}>{lang.api.response}</Text>

        <ResponseShow response={executeRoute.data} />
      </View>

      {executeRoute.error && (
        <Text style={[styles.feedback, { color: theme.danger }]}>{executeRoute.error.message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 0,
  },
  status: {
    fontSize: 14,
  },
  routesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  routeChipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  runButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runButtonLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  responsePanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  responseTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  feedback: {
    fontSize: 13,
    fontWeight: '600',
  },
});
