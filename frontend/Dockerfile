# Stage 1: Build React app
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the frontend code
COPY . .

# Build with production environment
# Vite will automatically use `.env.production`
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy the production build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional, if you want proxy fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
