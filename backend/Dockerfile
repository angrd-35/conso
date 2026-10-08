# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# prisma generate only needs the schema, but prisma.config.ts requires DATABASE_URL to be set
ENV DATABASE_URL="file:./build-placeholder.db"
RUN npx prisma generate
RUN npm run build
# nest build (tsc) does not copy the native Prisma query engine binary
RUN mkdir -p dist/generated/prisma \
  && find src/generated/prisma -maxdepth 1 -name '*.node' -exec cp {} dist/generated/prisma/ \;

# ---- production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
