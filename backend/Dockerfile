FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 8000

# For local development with docker-compose
# For production, API runs as serverless function on Vercel
CMD ["node", "src/index.js"]
