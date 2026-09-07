# Multi-stage Dockerfile for NestJS Monolith Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install native build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Native build tools for runtime packages
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev && npm install -D ts-node typescript @types/node

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Ensure uploads directory exists
RUN mkdir -p uploads/proofs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
