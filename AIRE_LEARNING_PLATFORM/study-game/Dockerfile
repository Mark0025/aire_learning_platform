# AIRE Learning Platform - Dockerfile
# Node.js 20.15.1 + pnpm + Express app
# Built by: Terry Agent (Cycle #1852 - Simplified build)
# Date: 2025-10-27

# Stage 1: Build environment
FROM node:20.15.1-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy application code
COPY . .

# Create required directories and files
RUN mkdir -p src/learning/modules src/learning/uploads src/data src/public/docs && \
    touch src/learning/modules/index.json && \
    echo '{"modules":[]}' > src/learning/modules/index.json

# Stage 2: Production environment
FROM node:20.15.1-alpine

WORKDIR /app

# Copy dependencies and application from builder
COPY --from=builder /app ./

# Create data directories with proper permissions
RUN chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Set environment
ENV NODE_ENV=production
ENV NODE_PORT=4000

# Start application
CMD ["node", "index.js"]
