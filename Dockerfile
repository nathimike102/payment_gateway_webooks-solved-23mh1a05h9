# This Dockerfile is for local development with docker-compose
# For production deployment, use Vercel: https://payment-gateway-h9.vercel.app
# The backend/Dockerfile and frontend/Dockerfile are used instead

# This file is kept for reference only - not used in current setup
# Use docker-compose.yml for local development instead

FROM node:18-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json backend/
RUN npm --prefix backend ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/node_modules ./backend/node_modules
COPY backend ./backend
EXPOSE 8000
CMD ["node", "backend/src/index.js"]
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy public assets (SDK)
COPY backend/public ./backend/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the API server (which will serve the frontend as static files)
CMD ["node", "backend/src/index.js"]
