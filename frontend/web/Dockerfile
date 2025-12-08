# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files first to leverage Docker cache for dependencies
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps flag due to known conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
