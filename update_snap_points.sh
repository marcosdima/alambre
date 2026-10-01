#!/bin/bash
sed -i 's/const rightSnapPoints = enableFullSwipe ? \[-actionThreshold \* 1.6, -SCREEN_WIDTH\] : \[-actionThreshold \* 1.6\];/const rightSnapPoints = enableFullSwipe ? [-80, -160, -SCREEN_WIDTH] : [-80, -160];/g' apps/playground/src/views/containers/SwipeableRowsTestbed.tsx
