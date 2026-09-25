# Stage 1: Build the Vue.js frontend application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build argument for backend API URL (embedded during build)
ARG VUE_APP_API_URL=http://localhost:5000
ENV VUE_APP_API_URL=${VUE_APP_API_URL}

# Build production bundle with Webpack / Vue CLI
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS production-stage

# Copy compiled static assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy Nginx SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
