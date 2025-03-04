import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getAuthTokens, setAuthTokens, clearAuthTokens } from '@/lib/auth';
import {
    AuthTokens,
    User,
    Student,
    Course,
    Batch,
    Enrollment,
    Invoice,
    Payment,
    PaginatedResponse,
    RegistrationRequest,
    RegistrationResponse,
    EnrollmentInitiateRequest,
    EnrollmentPaymentRequest,
    DashboardStats,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create a base API instance
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable sending cookies in cross-origin requests
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
                    },
                    { withCredentials: true }
                );

                const newAccess = response.data.access;

                // Update stored tokens
                setAuthTokens({
                    access: newAccess,
                    refresh: tokens.refresh,
                });

                // Retry the original request with new token
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

    register: (data: RegistrationRequest) =>
        api.post<RegistrationResponse>('/accounts/register/', data),

    refreshToken: (refreshToken: string) =>
        api.post<{ access: string }>('/accounts/token/refresh/', { refresh: refreshToken }),
};

// User & Student API calls
export const userApi = {
    getProfile: () => api.get<User>('/accounts/profile/'),

    updateProfile: (data: Partial<User>) => api.put<User>('/accounts/profile/', data),

    getStudents: () => api.get<PaginatedResponse<Student>>('/accounts/students/'),

    addStudent: (data: Omit<Student, 'id' | 'parent'>) =>
        api.post<Student>('/accounts/students/', data),

    getStudent: (id: number) => api.get<Student>(`/accounts/students/${id}/`),

    updateStudent: (id: number, data: Partial<Omit<Student, 'id' | 'parent'>>) =>
        api.put<Student>(`/accounts/students/${id}/`, data),
};

// Course API calls
export const courseApi = {
    getCourses: (params?: { is_active?: boolean }) =>
        api.get<PaginatedResponse<Course>>('/courses/courses/', { params }),

    getCourse: (id: number) => api.get<Course>(`/courses/courses/${id}/`),

    getBatches: (params?: { is_visible?: boolean; course?: number }) =>
        api.get<PaginatedResponse<Batch>>('/courses/batches/', { params }),

    getBatch: (id: number) => api.get<Batch>(`/courses/batches/${id}/`),
};

// Enrollment API calls
export const enrollmentApi = {
    initiateEnrollment: (data: EnrollmentInitiateRequest) =>
        api.post<Enrollment>('/enrollments/enrollments/initiate/', data),

    initiatePayment: (data: EnrollmentPaymentRequest) =>
        api.post<Payment>('/enrollments/enrollments/initiate_payment/', data),

    verifyAndCompletePayment: (data: { payment_id: string }) =>
        api.post<Payment>('/enrollments/enrollments/verify_and_complete_payment/', data),

    getEnrollments: (params?: { student?: number; is_active?: boolean }) =>
        api.get<PaginatedResponse<Enrollment>>('/enrollments/enrollments/', { params }),

    getEnrollment: (id: number) => api.get<Enrollment>(`/enrollments/enrollments/${id}/`),

    validateCoupon: (code: string, params?: { batch_id?: number }) =>
        api.get<{ valid: boolean; discount: number }>('/enrollments/coupons/validate/', {
            params: { code, ...params },
        }),
};

// Payment API calls
export const paymentApi = {
    getPendingInvoices: () =>
        api.get<PaginatedResponse<Invoice>>('/payments/payments/pending_invoices/'),

    payInvoice: (invoice_id: number) =>
        api.post<Payment>('/payments/payments/pay_invoice/', { invoice_id }),

    bulkPayInvoices: (invoice_ids: number[]) =>
        api.post<Payment[]>('/payments/payments/bulk_pay_invoices/', { invoice_ids }),

    executeBkashPayment: (payment_id: string) =>
        api.post<Payment>('/payments/payments/execute_bkash_payment/', { payment_id }),

    getPaymentHistory: () =>
        api.get<PaginatedResponse<Payment>>('/payments/payments/payment_history/'),
};

export default api;
