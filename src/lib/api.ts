import axios from 'axios';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const HARDCODED_URL = 'https://app-backend.zdc13k.easypanel.host/api';

const envURL = process.env.NEXT_PUBLIC_API_URL;
const finalURL = envURL && envURL !== '/api' ? envURL : HARDCODED_URL;

if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG API SOURCE:');
    console.log(' - NEXT_PUBLIC_API_URL:', envURL);
    console.log(' - isProd:', isProd);
    console.log(' - Final BaseURL:', finalURL);
}

const api = axios.create({
    baseURL: finalURL,
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
