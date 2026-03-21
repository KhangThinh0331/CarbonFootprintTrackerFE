// src/lib/axiosClient.ts
import axios from 'axios';

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
        if (error.response?.status === 401) {
            // Token hết hạn hoặc sai -> Xóa token và đá về trang Login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;