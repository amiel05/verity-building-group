FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY astro.config.mjs tsconfig.json ./
COPY src ./src
COPY scripts/server.mjs ./scripts/server.mjs
COPY public ./public
COPY docs/assets.json docs/public-inventory.json ./docs/
RUN pnpm build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/scripts/server.mjs ./scripts/server.mjs
USER node
EXPOSE 3000
CMD ["node","scripts/server.mjs"]
