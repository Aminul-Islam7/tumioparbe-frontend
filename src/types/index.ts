export interface User {
    id: number;
    phone: string;
    name: string;
    address: string;
    facebook_profile: string;
    email?: string;
    is_admin: boolean;
    date_joined?: string;
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

export interface AdminEnrollmentInfo {
    enrollment_id: number;
    batch_id: number;
    batch_name: string;
    course_id: number;
    course_name: string;
    start_month: string;
    tuition_fee: number | null;
    effective_tuition_fee: number;
    is_active: boolean;
}

export interface AdminStudent {
    id: number;
    name: string;
    date_of_birth: string;
    age: number;
    school?: string;
    current_class?: string;
    father_name: string;
    mother_name: string;
    parent_id: number;
    parent_name: string;
    parent_phone: string;
    parent_address: string;
    parent_facebook?: string;
    enrollments: AdminEnrollmentInfo[];
    created_at: string;
}

export interface FeaturedCouponDetails {
    id: number;
    code: string;
    offer_message: string;
    admission_fee_discount: number;
    tuition_fee_discount: number;
    first_month_discount: number;
    discounted_admission_fee: number;
    discounted_monthly_fee: number;
}

export interface Coupon {
    id: number;
    code: string;
    description?: string;
    offer_message?: string;
    course?: number;
    course_name?: string;
    is_public: boolean;
    admission_fee_discount: number;
    tuition_fee_discount: number;
    first_month_discount: number;
    expires_at: string | null;
    is_active: boolean;
    is_expired?: boolean;
    is_valid?: boolean;
}

export interface Course {
    id: number;
    name: string;
    description?: string;
    admission_fee: number;
    monthly_fee: number;
    is_active: boolean;
    featured_coupon?: number;
    featured_coupon_details?: FeaturedCouponDetails | null;
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
    created_at?: string;
    // Enriched fields from API
    student_name?: string;
    course_name?: string;
    batch_name?: string;
    month_display?: string;
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
    created_at?: string;
    updated_at?: string;
    // Enriched fields from API
    student_name?: string;
    student_id?: number;
    course_name?: string;
    course_id?: number;
    batch_name?: string;
    batch_id?: number;
    month?: string;
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
    enrollment_data: {
        student: number;
        batch: number;
        start_month: string;
        coupon_code?: string;
    };
    callback_url: string;
    customer_phone: string;
}

export interface EnrollmentPaymentResponse {
    temp_invoice_id: number;
    payment_id: string;
    bkash_url: string;
    total_amount: string;
    first_month_waiver: boolean;
    callback_urls: {
        success: string | null;
        failure: string | null;
        cancelled: string | null;
    };
    enrollment_data: Record<string, any>;
}

// Dashboard statistics
export interface DashboardStats {
    active_courses: number;
    active_enrollments: number;
    pending_invoices: number;
    total_paid: number;
}
