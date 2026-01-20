// Use localhost for development, relative path for production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:8000/api/v1' : '/api/v1');
