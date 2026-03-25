// src/lib/axiosClient.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Trước khi gửi API đi, tự động nhét Token vào Header
axiosClient.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage (sau khi đăng nhập thành công mình sẽ lưu vào đây)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor: Xử lý lỗi trả về từ Spring Boot (Ví dụ: hết hạn token)
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const serverMessage = error.response?.data?.message;
        const status = error.response?.status;
        if (status === 401) {
            toast.error(serverMessage || "Phiên đăng nhập hết hạn");
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
        }
        if (status === 403) {
            toast.error(serverMessage || "Bạn không có quyền truy cập");
        }
        return Promise.reject(serverMessage || error.message);
    }
);

export default axiosClient;