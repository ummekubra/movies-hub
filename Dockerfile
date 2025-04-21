# Use a specific alpine variant that is more stable
FROM node:20-alpine3.19 AS builder

# Set working directory
WORKDIR /app

# Install required dependencies only for building
COPY package*.json ./

# Install dependencies (no dev deps in final image)
RUN npm install

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# --------------------------------------
# Production image with only compiled code
# --------------------------------------
FROM node:20-alpine3.19

WORKDIR /app

# Optional: Patch base image packages
# RUN apk update && apk upgrade --no-cache

# Only copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose the port your NestJS app uses
EXPOSE 8080

# Start app
CMD ["node", "dist/main"]
