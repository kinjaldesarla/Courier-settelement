FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY tools/mock-notification-api/package.json ./tools/mock-notification-api/package.json
RUN npm ci --omit=dev --workspace tools/mock-notification-api

WORKDIR /app/tools/mock-notification-api

COPY tools/mock-notification-api/src ./src

ENV NODE_ENV=production
EXPOSE 5050

CMD ["node", "src/index.js"]

