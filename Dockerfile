FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/cli/package.json packages/cli/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/web/package.json packages/web/package.json

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PAPERPARSER_RUNTIME_MODE=deployed
ENV PAPERPARSER_STORE_PATH=/var/paperparser/store
ENV PAPERPARSER_WEB_DIST=/app/packages/web/dist

COPY --from=build /app /app

EXPOSE 8080

CMD ["node", "packages/cli/dist/index.js", "serve", "--deployed"]
