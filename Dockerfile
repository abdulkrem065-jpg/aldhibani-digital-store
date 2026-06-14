# ==========================================
# STAGE 1: Build Application
# ==========================================
FROM node:20-slim AS builder

# Set working directory inside container
WORKDIR /usr/src/app

# Install all package dependencies (including devDependencies for esbuild & vite)
COPY package*.json ./
RUN npm ci

# Copy all source code files
COPY . .

# Build Vite frontend assets & compile Serverless TS compiler into single bundle (dist/server.cjs)
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Execution
# ==========================================
FROM node:20-slim AS runner

WORKDIR /usr/src/app

# Inform application we are in production
ENV NODE_ENV=production
# Default port which can be dynamically overriden by Google Cloud Run
ENV PORT=3000

# Copy only package manifest to perform direct lightweight production install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the internal port (default 3000)
EXPOSE 3000

# Command to handle production process start
CMD ["node", "dist/server.cjs"]
