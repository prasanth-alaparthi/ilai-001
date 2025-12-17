# Stage 1: Build the React application
FROM node:20-slim as builder

WORKDIR /app

# Increase Node.js memory limit for the build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Set npm configuration for faster installs
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-mintimeout 15000 \
    && npm config set fetch-retry-maxtimeout 60000

# Copy package files first to leverage Docker cache for dependencies
COPY package.json package-lock.json ./

# Use npm ci for faster, cleaner installs in CI/Docker environments
# Use npm ci for faster, cleaner installs in CI/Docker environments
# npm ci is faster and more reliable than npm install for CI builds
# Added retry logic for network resilience
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm ci --legacy-peer-deps --no-audit --no-fund || \
    (sleep 10 && npm ci --legacy-peer-deps --no-audit --no-fund) || \
    (sleep 30 && npm ci --legacy-peer-deps --no-audit --no-fund)

# Copy the rest of the application code
COPY . .

# Build the application with production optimization
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

