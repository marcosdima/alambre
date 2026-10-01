#!/bin/bash
sed -i 's/const rightSnapPoints = enableFullSwipe ? \[-80, -160, -SCREEN_WIDTH\] : \[-80, -160\];/const rightSnapPoints = enableFullSwipe ? [-actionThreshold, -actionThreshold * 2, -SCREEN_WIDTH] : [-actionThreshold, -actionThreshold * 2];/g' apps/playground/src/views/containers/SwipeableRowsTestbed.tsx
