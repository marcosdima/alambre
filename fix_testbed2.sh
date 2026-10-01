#!/bin/bash
sed -i 's/onSnap: (direction, point) => {/onSnap: (direction: any, point: number) => {/g' apps/playground/src/views/containers/SwipeableRowsTestbed.tsx
