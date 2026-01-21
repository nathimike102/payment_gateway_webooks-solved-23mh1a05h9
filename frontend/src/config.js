// Use relative path for API calls (works for both Docker and production)
// Docker nginx proxy will route /api/* to http://api:8000
// Production Vercel routes /api/v1/* to serverless function
export const API_URL = '/api/v1';

