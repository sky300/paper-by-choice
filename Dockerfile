# syntax=docker/dockerfile:1

# Static site for self-hosting on a NAS or a small home server.
# Build:  docker build -t paper-by-choice .
# Run:    docker run -p 8080:80 paper-by-choice
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# The app is fully client-side; a single index.html plus assets is enough.
EXPOSE 80
