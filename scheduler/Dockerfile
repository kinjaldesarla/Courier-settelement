FROM node:20-alpine

WORKDIR /app

COPY scheduler/package.json scheduler/package-lock.json* ./
RUN npm ci --omit=dev

COPY scheduler/src ./src
COPY backend /backend

ENV NODE_ENV=production

CMD ["node", "src/index.js"]

