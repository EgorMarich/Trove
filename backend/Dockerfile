FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY tsconfig.json .eslintrc.js .prettierrc.json ./
COPY src ./src
COPY db ./db
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/db ./db
COPY scripts-migrate.sh ./scripts-migrate.sh
RUN chmod +x ./scripts-migrate.sh
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
