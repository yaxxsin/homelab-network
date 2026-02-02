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
FROM nginx:stable-alpine

# Salin hasil build dari stage 1 ke direktori default Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ekspos port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
