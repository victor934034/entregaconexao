import axios from 'axios';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const fallbackURL = isProd
    ? 'https://app-backend.zdc13k.easypanel.host/api'
    : '/api';

const baseURL = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '/api'
    ? process.env.NEXT_PUBLIC_API_URL
    : fallbackURL;

console.log('📡 API BaseURL:', baseURL);
const api = axios.create({
    baseURL,
});

// Interceptor para injetar o token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('@Conexao:token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para redirecionar no 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('@Conexao:token');
            localStorage.removeItem('@Conexao:user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
