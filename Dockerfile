# Dockerfile for Next.js app with standalone output

# First stage: Build the app
FROM oven/bun:slim AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the app with standalone output
RUN bun run build

# Second stage: Production runtime
FROM oven/bun:slim AS runner

WORKDIR /app

# Create a non-root user
RUN apt-get update && apt-get install -y passwd && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs
RUN useradd -s /bin/bash -u 1001 -g nodejs nextjs

# Copy the standalone build from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment
ENV PORT=3000
ENV NODE_ENV=production

# Start the app
CMD ["bun", "server.js"]
