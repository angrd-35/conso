# ---- build ----
FROM node:22.23.4-alpine3.24 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime (nginx non root, écoute sur 8080) ----
FROM nginxinc/nginx-unprivileged:1.31.7-alpine3.24
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
