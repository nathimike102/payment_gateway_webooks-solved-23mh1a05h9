# Build stage - Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json frontend/
RUN npm install && npm --prefix frontend install

COPY frontend ./frontend
RUN npm --prefix frontend run build

# Build stage - Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install && npm --prefix backend install

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install --only=production && npm --prefix backend install --only=production

# Copy backend source
COPY backend ./backend

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy public assets (SDK)
COPY backend/public ./backend/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the API server (which will serve the frontend as static files)
CMD ["node", "backend/src/index.js"]
