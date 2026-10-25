# Lightweight Node.js container for Alambre Room Relay Server
FROM node:22-alpine AS runner

WORKDIR /app

# Install minimal production dependency (ws)
RUN npm init -y && npm install --omit=dev ws

# Copy the standalone relay server script
COPY ../scripts/relay-server.mjs ./relay-server.mjs

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

# Healthcheck pinging the HTTP status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3   CMD node -e "const http = require('http'); http.get('http://localhost:' + process.env.PORT, (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

CMD ["node", "relay-server.mjs"]
