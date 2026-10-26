# ---- build ----
FROM node:22.23.4-alpine3.24 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# prisma generate only needs the schema, but prisma.config.ts requires DATABASE_URL to be set
ENV DATABASE_URL="file:./build-placeholder.db"
RUN npx prisma generate
RUN npm run build
# nest build (tsc) does not copy the native Prisma query engine binary
RUN mkdir -p dist/generated/prisma \
  && find src/generated/prisma -maxdepth 1 -name '*.node' -exec cp {} dist/generated/prisma/ \;

# ---- production dependencies ----
FROM node:22.23.4-alpine3.24 AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:22.23.4-alpine3.24
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./

# Le volume nommé hérite de ce propriétaire à sa première création.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
