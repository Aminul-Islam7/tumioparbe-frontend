import api from '@/lib/api';
import {
    Course,
    Batch,
    Enrollment,
    PaginatedResponse,
    User,
    Student,
    AdminStudent,
    Coupon,
    AdminInvoice,
    InvoiceStats,
    EnrollmentForSelect,
} from '@/types';

// Extended types for admin views
export interface AdminBatchWithStudents extends Batch {
    enrollments?: AdminEnrollmentDetails[];
}

export interface AdminEnrollmentDetails {
    id: number;
    student: {
        id: number;
        name: string;
        date_of_birth: string;
        parent: {
            id: number;
            name: string;
            phone: string;
        };
    };
    batch: {
        id: number;
        name: string;
        course_id: number;
    };
    student_details?: {
        id: number;
        parent: number;
        name: string;
        date_of_birth: string;
        school?: string;
        current_class?: string;
        father_name?: string;
        mother_name?: string;
    };
    batch_details?: {
        id: number;
        course: number;
        name: string;
        timing: string;
        group_link?: string;
        class_link?: string;
        tuition_fee?: number;
        is_visible: boolean;
        student_count?: number;
    };
    student_name?: string | null;
    parent_name?: string | null;
    parent_phone?: string | null;
    parent_id?: number | null;
    parent_address?: string | null;
    course_name?: string | null;
    batch_name?: string | null;
    tuition_fee: number | null;
    effective_tuition_fee: number;
    fee_type: 'individual' | 'batch' | 'course';
    start_month: string;
    earliest_enrollment_month: string;
    is_active: boolean;
    created_at: string;
}

export interface AdminCourseDetails extends Course {
    total_students: number;
    active_enrollments: number;
}

export interface AdminStats {
    total_courses: number;
    active_courses: number;
    total_batches: number;
    total_students: number;
    total_parents: number;
    total_admins: number;
    pending_payments: number;
    monthly_revenue: number;
}

export interface CreateCourseData {
    name: string;
    description?: string;
    admission_fee: number;
    monthly_fee: number;
    is_active?: boolean;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export interface CreateBatchData {
    course: number;
    name: string;
    timing: string;
    group_link?: string;
    class_link?: string;
    tuition_fee?: number | null;
    is_visible?: boolean;
}

export interface UpdateBatchData extends Partial<Omit<CreateBatchData, 'course'>> {}

export interface TransferStudentData {
    destination_batch_id: number;
    student_ids: number[];
}

export interface UpdateEnrollmentFeeData {
    tuition_fee: number | null;
}

export interface AdminCreateUserData {
    name: string;
    phone: string;
    address: string;
    new_password: string;
    confirm_password: string;
    facebook_profile?: string;
    email?: string;
    is_admin?: boolean;
    password: string; // current admin's password for verification
}

export interface AdminCreateStudentData {
    name: string;
    date_of_birth: string;
    parent: number;
    school?: string;
    current_class?: string;
    father_name?: string;
    mother_name?: string;
}

// Admin API calls
export const adminApi = {
    // Dashboard Stats
    getStats: () =>
        api.get<AdminStats>('/common/reports/dashboard_stats/'),

    // Course Management
    getCourses: (params?: { is_active?: boolean }) =>
        api.get<PaginatedResponse<AdminCourseDetails>>('/courses/courses/', { params }),

    getCourse: (id: number) =>
        api.get<AdminCourseDetails>(`/courses/courses/${id}/`),

    createCourse: (data: CreateCourseData) =>
        api.post<Course>('/courses/courses/', data),

    updateCourse: (id: number, data: UpdateCourseData) =>
        api.patch<Course>(`/courses/courses/${id}/`, data),

    deleteCourse: (id: number) =>
        api.delete<{ message?: string }>(`/courses/courses/${id}/`),

    // Batch Management
    getBatches: (params?: { course?: number; is_visible?: boolean }) =>
        api.get<PaginatedResponse<Batch>>('/courses/batches/', { params }),

    getBatch: (id: number) =>
        api.get<AdminBatchWithStudents>(`/courses/batches/${id}/`),

    createBatch: (data: CreateBatchData) =>
        api.post<Batch>('/courses/batches/', data),

    updateBatch: (id: number, data: UpdateBatchData) =>
        api.patch<Batch>(`/courses/batches/${id}/`, data),

    deleteBatch: (id: number) =>
        api.delete<{ message?: string }>(`/courses/batches/${id}/`),

    // Batch Student Management
    getBatchStudents: (batchId: number) =>
        api.get<AdminEnrollmentDetails[]>(`/courses/batches/${batchId}/enrolled_students/`),

    transferStudents: (sourceBatchId: number, data: TransferStudentData) =>
        api.post<{
            source_batch: { id: number; name: string };
            destination_batch: { id: number; name: string };
            transferred_students: { id: number; name: string }[];
            count: number;
        }>(`/courses/batches/${sourceBatchId}/transfer_students/`, data),

    // Enrollment Management
    getEnrollments: (params?: { batch?: number; student?: number; is_active?: boolean; offset?: number; limit?: number }) =>
        api.get<PaginatedResponse<AdminEnrollmentDetails>>('/enrollments/enrollments/', { params }),

    getEnrollment: (id: number) =>
        api.get<AdminEnrollmentDetails>(`/enrollments/enrollments/${id}/`),

    createEnrollment: (data: { student: number; batch: number; start_month: string; tuition_fee?: number | null }) =>
        api.post<AdminEnrollmentDetails>('/enrollments/enrollments/', data),

    updateEnrollmentFee: (id: number, data: UpdateEnrollmentFeeData) =>
        api.patch<Enrollment>(`/enrollments/enrollments/${id}/`, data),

    updateEnrollment: (id: number, data: Partial<Enrollment>) =>
        api.patch<Enrollment>(`/enrollments/enrollments/${id}/`, data),

    deactivateEnrollment: (id: number) =>
        api.patch<Enrollment>(`/enrollments/enrollments/${id}/`, { is_active: false }),

    // Student Management
    getAllStudents: (params?: {
        search?: string;
        batch?: number;
        course?: number;
        parent?: number;
        current_class?: string;
        has_active_enrollment?: 'true' | 'false';
        min_age?: number;
        max_age?: number;
        ordering?: string;
    }) =>
        api.get<PaginatedResponse<AdminStudent>>('/accounts/students/', { params }),

    getStudent: (id: number) =>
        api.get<AdminStudent>(`/accounts/students/${id}/`),

    updateStudent: (id: number, data: Partial<Student>) =>
        api.patch<AdminStudent>(`/accounts/students/${id}/`, data),

    createStudent: (data: AdminCreateStudentData) =>
        api.post<AdminStudent>('/accounts/students/', data),


    // Parent/User Management
    getAllUsers: (params?: { search?: string }) =>
        api.get<PaginatedResponse<User>>('/accounts/users/', { params }),

    getAllParents: (params?: { search?: string }) =>
        api.get<PaginatedResponse<User>>('/accounts/parents/', { params }),

    getAllAdmins: (params?: { search?: string }) =>
        api.get<PaginatedResponse<User>>('/accounts/admins/', { params }),

    getUser: (id: number) =>
        api.get<User>(`/accounts/users/${id}/`),

    updateUser: (id: number, data: Partial<User>) =>
        api.patch<User>(`/accounts/users/${id}/`, data),

    grantAdmin: (id: number, password: string) =>
        api.post<{ success: boolean; message: string; user: User }>(`/accounts/users/${id}/grant_admin/`, { password }),

    revokeAdmin: (id: number, password: string) =>
        api.post<{ success: boolean; message: string; user: User }>(`/accounts/users/${id}/revoke_admin/`, { password }),

    updateUserPhone: (id: number, new_phone: string, password: string) =>
        api.post<{ success: boolean; message: string; user: User }>(`/accounts/users/${id}/update_phone/`, { new_phone, password }),

    adminCreateUser: (data: AdminCreateUserData) =>
        api.post<{ success: boolean; message: string; user: User }>('/accounts/users/admin_create/', data),

    // Coupon Management
    getCoupons: (params?: { course?: number; is_active?: boolean; is_public?: boolean }) =>
        api.get<PaginatedResponse<Coupon>>('/enrollments/coupons/', { params }),

    // Invoice Management
    getInvoices: (params?: {
        is_paid?: string;
        course?: number;
        batch?: number;
        student?: number;
        parent?: number;
        enrollment?: number;
        month_from?: string;
        month_to?: string;
        search?: string;
        overdue?: string;
        ordering?: string;
        offset?: number;
        limit?: number;
    }) =>
        api.get<AdminInvoice[]>('/payments/admin-invoices/', { params }),

    getInvoiceStats: (params?: {
        is_paid?: string;
        course?: number;
        batch?: number;
        student?: number;
        parent?: number;
        month_from?: string;
        month_to?: string;
        search?: string;
        overdue?: string;
    }) =>
        api.get<InvoiceStats>('/payments/admin-invoices/stats/', { params }),

    createInvoice: (data: {
        enrollment: number;
        month: string;
        amount: number;
        is_paid?: boolean;
        description?: string;
    }) =>
        api.post<AdminInvoice>('/payments/admin-invoices/create_manual/', data),

    updateInvoice: (id: number, data: { amount?: number; month?: string }) =>
        api.patch<AdminInvoice>(`/payments/admin-invoices/${id}/`, data),

    deleteInvoice: (id: number) =>
        api.delete<{ message: string }>(`/payments/admin-invoices/${id}/`),

    markInvoicePaid: (id: number) =>
        api.post<AdminInvoice>(`/payments/admin-invoices/${id}/mark_paid/`),

    markInvoiceUnpaid: (id: number) =>
        api.post<AdminInvoice>(`/payments/admin-invoices/${id}/mark_unpaid/`),

    searchEnrollmentsForInvoice: (search?: string) =>
        api.get<EnrollmentForSelect[]>('/payments/admin-invoices/enrollments_for_select/', { params: { search } }),

    generateInvoices: (data?: { course?: number; batch?: number; month_from?: string; month_to?: string }) =>
        api.post<{ message: string; details: Record<string, number>; total_created: number }>('/payments/admin-invoices/generate_invoices/', data),
};

export default adminApi;
