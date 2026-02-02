# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file proyek
COPY . .

# Build aplikasi
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install hanya production dependencies
RUN npm install --omit=dev

# Salin hasil build dan server.js
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# Buat folder data
RUN mkdir -p /app/data

# Ekspos port 3301
EXPOSE 3301

# Jalankan server
CMD ["node", "server.js"]
