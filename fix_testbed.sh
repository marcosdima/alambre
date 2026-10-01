#!/bin/bash
sed -i "s/import { Gesture, GestureDetector } from 'react-native-gesture-handler';/import { Gesture, GestureDetector } from 'react-native-gesture-handler';\nimport { useSwipeableRow } from 'alambre';/" apps/playground/src/views/containers/SwipeableRowsTestbed.tsx
