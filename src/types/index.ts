export interface User {
    id: number;
    phone: string;
    name: string;
    address: string;
    facebook_profile: string;
    email?: string;
    is_admin: boolean;
}

export interface Student {
    id: number;
    parent: number;
    name: string;
    date_of_birth: string;
    school?: string;
    current_class?: string;
    father_name: string;
    mother_name: string;
}

export interface Course {
    id: number;
    name: string;
    description?: string;
    admission_fee: number;
    tuition_fee: number;
    is_active: boolean;
    batches: Batch[];
}

export interface Batch {
    id: number;
    course: number;
    name: string;
    timing: string;
    group_link?: string;
    class_link?: string;
    tuition_fee?: number;
    is_visible: boolean;
    student_count: number;
}

export interface Enrollment {
    id: number;
    student: number;
    batch: number;
    start_month: string;
    tuition_fee: number;
    is_active: boolean;
    coupon?: number;
}

export interface Invoice {
    id: number;
    enrollment: number;
    month: string;
    amount: number;
    is_paid: boolean;
    coupon?: number;
}

export interface Payment {
    id: number;
    invoice: number;
    transaction_id: string;
    payment_id: string;
    amount: number;
    payment_method: string;
    status: string;
    payer_reference: string;
    payment_create_time: string;
    payment_execute_time: string;
}

export interface AuthTokens {
    refresh: string;
    access: string;
}

export interface ApiError {
    error: string;
    details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Authentication related types
export interface LoginRequest {
    phone: string;
    password: string;
}

export interface OtpRequest {
    phone: string;
}

export interface OtpVerifyRequest {
    phone: string;
    otp: string;
}

export interface RegistrationRequest {
    phone: string;
    name: string;
    address: string;
    facebook_profile: string;
    email?: string;
    password: string;
    confirm_password: string;
}

export interface RegistrationResponse {
    success: boolean;
    user: User;
    refresh: string;
    access: string;
}

// Enrollment related types
export interface EnrollmentInitiateRequest {
    student: number;
    batch: number;
    start_month: string;
    coupon_code?: string;
}

export interface EnrollmentPaymentRequest {
    enrollment_id: number;
    amount: number;
}

// Dashboard statistics
export interface DashboardStats {
    active_courses: number;
    active_enrollments: number;
    pending_invoices: number;
    total_paid: number;
}
