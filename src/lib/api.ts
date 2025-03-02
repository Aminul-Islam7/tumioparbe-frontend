import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getAuthTokens, setAuthTokens, clearAuthTokens } from '@/lib/auth';
import { AuthTokens, ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create a base API instance
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const tokens = getAuthTokens();
        if (tokens?.access && config.headers) {
            config.headers.Authorization = `Bearer ${tokens.access}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If 401 response and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const tokens = getAuthTokens();

                if (!tokens?.refresh) {
                    clearAuthTokens();
                    return Promise.reject(error);
                }

                const response = await axios.post<{ access: string }>(
                    `${BASE_URL}/accounts/token/refresh/`,
                    {
                        refresh: tokens.refresh,
                    }
                );

                const newAccess = response.data.access;

                // Update stored tokens
                setAuthTokens({
                    access: newAccess,
                    refresh: tokens.refresh,
                });

                // Retry the original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                }

                return axios(originalRequest);
            } catch (refreshError) {
                clearAuthTokens();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API calls
export const authApi = {
    login: (phone: string, password: string) =>
        api.post<AuthTokens>('/accounts/token/', { phone, password }),

    requestOtp: (phone: string) =>
        api.post<{ success: boolean; expires_in: number }>('/accounts/request-otp/', { phone }),

    verifyOtp: (phone: string, otp: string) =>
        api.post<{ success: boolean }>('/accounts/verify-otp/', { phone, otp }),

    register: (data: any) => api.post('/accounts/register/', data),
};

// User & Student API calls
export const userApi = {
    getProfile: () => api.get('/accounts/profile/'),

    updateProfile: (data: any) => api.put('/accounts/profile/', data),

    getStudents: () => api.get('/accounts/students/'),

    addStudent: (data: any) => api.post('/accounts/students/', data),

    getStudent: (id: number) => api.get(`/accounts/students/${id}/`),

    updateStudent: (id: number, data: any) => api.put(`/accounts/students/${id}/`, data),
};

// Course API calls
export const courseApi = {
    getCourses: (params?: any) => api.get('/courses/courses/', { params }),

    getCourse: (id: number) => api.get(`/courses/courses/${id}/`),

    getBatches: (params?: any) => api.get('/courses/batches/', { params }),

    getBatch: (id: number) => api.get(`/courses/batches/${id}/`),
};

// Enrollment API calls
export const enrollmentApi = {
    initiateEnrollment: (data: any) => api.post('/enrollments/enrollments/initiate/', data),

    initiatePayment: (data: any) => api.post('/enrollments/enrollments/initiate_payment/', data),

    verifyAndCompletePayment: (data: any) =>
        api.post('/enrollments/enrollments/verify_and_complete_payment/', data),

    getEnrollments: (params?: any) => api.get('/enrollments/enrollments/', { params }),

    getEnrollment: (id: number) => api.get(`/enrollments/enrollments/${id}/`),

    validateCoupon: (code: string, params?: any) =>
        api.get('/enrollments/coupons/validate/', {
            params: { code, ...params },
        }),
};

// Payment API calls
export const paymentApi = {
    getPendingInvoices: () => api.get('/payments/payments/pending_invoices/'),

    payInvoice: (invoice_id: number) => api.post('/payments/payments/pay_invoice/', { invoice_id }),

    bulkPayInvoices: (invoice_ids: number[]) =>
        api.post('/payments/payments/bulk_pay_invoices/', { invoice_ids }),

    executeBkashPayment: (payment_id: string) =>
        api.post('/payments/payments/execute_bkash_payment/', { payment_id }),

    getPaymentHistory: () => api.get('/payments/payments/payment_history/'),
};

export default api;
