'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { courseApi, userApi, enrollmentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

import { Course, Student, Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectOption } from '@/components/ui/select';
import {
    ArrowLeft,
    CreditCard,
    Loader2,
    AlertTriangle,
    Ticket,
    Info,
    CheckCircle,
    User,
} from 'lucide-react';

// Validation schema
const EnrollmentSchema = Yup.object().shape({
    studentId: Yup.number()
        .required('Student is required')
        .typeError('Student is required'),
    batchId: Yup.number()
        .required('Please select a batch')
        .typeError('Please select a batch'),
    startMonth: Yup.string().required('Please select a start month'),
    couponCode: Yup.string(),
});

// Helper function to calculate discount percentage
const calculateDiscountPercent = (original: number, discounted: number): number => {
    if (original <= 0) return 0;
    const percent = ((original - discounted) / original) * 100;
    return Math.ceil(percent);
};

export default function EnrollmentPage() {
    const { user } = useAuth(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseIdParam = searchParams.get('course');
    const studentIdParam = searchParams.get('student');

    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [availableMonths, setAvailableMonths] = useState<SelectOption[]>([]);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [publicCoupons, setPublicCoupons] = useState<Coupon[]>([]);
    const [allCouponCodes, setAllCouponCodes] = useState<string[]>([]); // Preloaded valid codes
    const [couponBenefits, setCouponBenefits] = useState<any[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [initialCouponCode, setInitialCouponCode] = useState<string>('');

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch students
                const studentsResponse = await userApi.getStudents();
                const fetchedStudents = Array.isArray(studentsResponse.data)
                    ? studentsResponse.data
                    : studentsResponse.data?.results || [];
                setStudents(fetchedStudents);

                // Find the selected student from URL param
                if (studentIdParam) {
                    const studentId = parseInt(studentIdParam);
                    const student = fetchedStudents.find((s: Student) => s.id === studentId);
                    if (student) {
                        setSelectedStudent(student);
                    }
                }

                // Fetch course details if course ID is provided
                if (courseIdParam) {
                    const courseResponse = await courseApi.getCourse(parseInt(courseIdParam));
                    const fetchedCourse = courseResponse.data;
                    setCourse(fetchedCourse);

                    // Check for featured coupon and set it as initial
                    if (fetchedCourse.featured_coupon_details?.code) {
                        setInitialCouponCode(fetchedCourse.featured_coupon_details.code);
                    }

                    // Fetch public coupons (for display as selectable offers)
                    try {
                        const couponsResponse = await enrollmentApi.getPublicCoupons({ course_id: parseInt(courseIdParam) });
                        if (couponsResponse.data) {
                            setPublicCoupons(couponsResponse.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch public coupons", err);
                    }

                    // Fetch ALL valid coupon codes (public + private) for instant frontend validation
                    try {
                        const codesResponse = await enrollmentApi.getValidCouponCodes({ course_id: parseInt(courseIdParam) });
                        if (codesResponse.data?.codes) {
                            setAllCouponCodes(codesResponse.data.codes);
                        }
                    } catch (err) {
                        console.error("Failed to fetch valid coupon codes", err);
                    }
                }

                // Generate available months (current month + 2 future months)
                const now = new Date();
                const months: SelectOption[] = [];

                for (let i = 0; i < 3; i++) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    // Standardize to YYYY-MM-DD (backend requires full date)
                    const year = monthDate.getFullYear();
                    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
                    const value = `${year}-${month}-01`;
                    
                    const label = monthDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                    });

                    months.push({ value, label });
                }

                setAvailableMonths(months);
            } catch (error) {
                console.error('Failed to load enrollment data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseIdParam, studentIdParam]);

    // Get visible batches as SelectOptions
    const getBatchOptions = useCallback((): SelectOption[] => {
        if (!course) return [];
        return course.batches
            .filter((batch) => batch.is_visible)
            .map((batch) => ({
                value: batch.id,
                label: batch.name,
                description: `${batch.timing}${batch.tuition_fee && batch.tuition_fee !== course.monthly_fee ? ` • ৳${Math.round(batch.tuition_fee)}/mo` : ''}`,
            }));
    }, [course]);

    // Validate coupon code against preloaded codes (frontend-only)
    const validateCouponFrontend = useCallback((code: string): boolean => {
        if (!code) return false;
        const normalizedCode = code.toUpperCase().trim();
        return allCouponCodes.includes(normalizedCode);
    }, [allCouponCodes]);

    // Handle coupon validation (full backend validation for benefits)
    const validateCoupon = async (code: string, batchId?: number) => {
        try {
            if (!course || !code) {
                setCouponApplied(false);
                setCouponBenefits([]);
                setCouponError(null);
                return false;
            }
            
            setCouponError(null);
            const normalizedCode = code.toUpperCase().trim();
            
            const selectedBatch = batchId ? course.batches.find(b => b.id === batchId) : null;
            const admissionFee = course.admission_fee;
            const tuitionFee = selectedBatch?.tuition_fee || course.monthly_fee;

            const response = await enrollmentApi.validateCoupon(normalizedCode, { 
                course_id: course.id,
                admission_fee: admissionFee,
                tuition_fee: tuitionFee
            });

            if (response.data && response.data.code) {
                setCouponApplied(true);
                setCouponBenefits(response.data.benefits || []);
                return true;
            } else {
                setCouponApplied(false);
                setCouponBenefits([]);
                return false;
            }
        } catch (error: any) {
            console.error('Failed to validate coupon:', error);
            setCouponApplied(false);
            setCouponBenefits([]);
            
            const errorMessage = error?.response?.data?.error || 'Invalid coupon code';
            setCouponError(errorMessage);
            return false;
        }
    };

    // Debounce timer for coupon validation
    const couponDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Handle coupon input change (validate on input)
    const handleCouponChange = useCallback((code: string, setFieldValue: any, batchId?: number) => {
        setFieldValue('couponCode', code.toUpperCase());
        
        // Clear any pending debounce
        if (couponDebounceRef.current) {
            clearTimeout(couponDebounceRef.current);
        }
        
        if (!code.trim()) {
            setCouponApplied(false);
            setCouponBenefits([]);
            setCouponError(null);
            return;
        }

        // Add 1 second delay to let the user complete typing
        couponDebounceRef.current = setTimeout(() => {
            const normalizedCode = code.toUpperCase().trim();
            
            // Check against ALL preloaded valid codes (public + private)
            if (validateCouponFrontend(normalizedCode)) {
                // Valid code found! Fetch benefits from backend
                validateCoupon(normalizedCode, batchId);
            } else {
                // Invalid code - reject immediately (no backend call needed)
                setCouponApplied(false);
                setCouponBenefits([]);
                // Only show error if user has typed something substantial
                if (normalizedCode.length >= 3) {
                    setCouponError('Invalid coupon code');
                } else {
                    setCouponError(null);
                }
            }
        }, 1000);
    }, [validateCouponFrontend]);

    // Auto-validate featured coupon on load (wait for codes to be loaded)
    useEffect(() => {
        if (initialCouponCode && course && allCouponCodes.length > 0 && !couponApplied) {
            validateCoupon(initialCouponCode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCouponCode, course, allCouponCodes]);

    // Get original fees
    const getOriginalFees = (batchId: number | undefined) => {
        if (!course) {
            return { admissionFee: 0, tuitionFee: 0, total: 0 };
        }

        const selectedBatch = batchId ? course.batches.find((b) => b.id === batchId) : null;
        const admissionFee = course.admission_fee;
        const tuitionFee = selectedBatch?.tuition_fee || course.monthly_fee;

        return {
            admissionFee,
            tuitionFee,
            total: admissionFee + tuitionFee,
        };
    };

    // Get recurring monthly fee
    const getRecurringMonthlyFee = (batchId: number | undefined) => {
        if (!course) return 0;

        const selectedBatch = batchId ? course.batches.find((b) => b.id === batchId) : null;
        let tuitionFee = Number(selectedBatch?.tuition_fee || course.monthly_fee) || 0;

        if (couponApplied && couponBenefits.length > 0) {
            const tuitionBenefit = couponBenefits.find((b: any) => b.type === 'TUITION');
            if (tuitionBenefit && tuitionBenefit.new_amount !== null) {
                tuitionFee = parseFloat(tuitionBenefit.new_amount);
            }
        }

        return tuitionFee;
    };

    // Calculate fee details
    const calculateFees = (batchId: number | undefined) => {
        if (!course) {
            return { admissionFee: 0, tuitionFee: 0, total: 0 };
        }

        const selectedBatch = batchId ? course.batches.find((b) => b.id === batchId) : null;
        let admissionFee = Number(course.admission_fee) || 0;
        let tuitionFee = Number(selectedBatch?.tuition_fee || course.monthly_fee) || 0;

        if (couponApplied && couponBenefits.length > 0) {
            const admissionBenefit = couponBenefits.find((b: any) => b.type === 'ADMISSION');
            if (admissionBenefit && admissionBenefit.new_amount !== null) {
                admissionFee = parseFloat(admissionBenefit.new_amount);
            }

            const firstMonthBenefit = couponBenefits.find((b: any) => b.type === 'FIRST_MONTH');
            const tuitionBenefit = couponBenefits.find((b: any) => b.type === 'TUITION');
            
            if (firstMonthBenefit && firstMonthBenefit.new_amount !== null) {
                tuitionFee = parseFloat(firstMonthBenefit.new_amount);
            } else if (tuitionBenefit && tuitionBenefit.new_amount !== null) {
                tuitionFee = parseFloat(tuitionBenefit.new_amount);
            }
        }

        return {
            admissionFee,
            tuitionFee,
            total: admissionFee + tuitionFee,
        };
    };

    // Handle enrollment
    const handleEnrollment = async (values: any, { setSubmitting }: any) => {
        try {
            setFormError(null);
            setEnrolling(true);

            // Validate that the user has a phone number on file
            const customerPhone = user?.phone || '';
            if (!customerPhone) {
                setFormError(
                    'Your account does not have a phone number. Please update your profile with a valid phone number before enrolling.'
                );
                return;
            }

            const normalizedCouponCode = values.couponCode ? values.couponCode.toUpperCase().trim() : undefined;

            const enrollmentData = {
                student: values.studentId,
                batch: values.batchId,
                start_month: values.startMonth,
                coupon_code: normalizedCouponCode,
            };

            // Get callback URL for bKash redirect
            const callbackUrl = `${window.location.origin}/dashboard/courses?student=${values.studentId}&payment_callback=true`;

            // Initiate payment with enrollment data
            const paymentResponse = await enrollmentApi.initiatePayment({
                enrollment_data: enrollmentData,
                callback_url: callbackUrl,
                customer_phone: customerPhone,
            });

            if (paymentResponse.data) {
                // If there's a bKash URL, redirect to it
                if (paymentResponse.data.bkash_url) {
                    window.location.href = paymentResponse.data.bkash_url;
                } else {
                    // Otherwise, just go back to courses
                    setTimeout(() => {
                        router.push(`/dashboard/courses?student=${values.studentId}`);
                    }, 1500);
                }
            }
        } catch (error: any) {
            console.error('Failed to complete enrollment:', error);
            
            // Extract technical details for logging/debugging
            let technicalDetails = '';
            if (error?.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    technicalDetails = data;
                } else if (data.error) {
                    technicalDetails = data.error;
                } else if (data.detail) {
                    technicalDetails = data.detail;
                } else if (data.non_field_errors) {
                    technicalDetails = data.non_field_errors.join(', ');
                } else {
                    const fieldErrors = Object.entries(data)
                        .filter(([key]) => !['error', 'detail', 'non_field_errors'].includes(key))
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('. ');
                    if (fieldErrors) {
                        technicalDetails = fieldErrors;
                    }
                }
            }
            
            // User-friendly error message
            const userMessage = 'An error occurred. Please try again later.';
            setFormError(technicalDetails ? `${userMessage}\n\nError details: ${technicalDetails}` : userMessage);
        } finally {
            setEnrolling(false);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading enrollment data...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-heading">Course Enrollment</h1>

                <div className="bg-card rounded-card border-2 border-amber-200 dark:border-amber-800 p-8 text-center shadow-card">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">Course Not Found</h2>
                    <p className="text-body-muted mb-4">
                        The course you're looking for could not be found. Please try again.
                    </p>
                    <Button
                        variant="warning"
                        onClick={() => router.push('/dashboard/courses')}
                        className="mx-auto"
                        size="lg"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Courses
                    </Button>
                </div>
            </div>
        );
    }

    if (!selectedStudent) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-heading">Course Enrollment</h1>

                <div className="bg-card rounded-card border-2 border-amber-200 dark:border-amber-800 p-8 text-center shadow-card">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">No Student Selected</h2>
                    <p className="text-body-muted mb-4">
                        Please select a student from the courses page to enroll them.
                    </p>
                    <Button
                        variant="warning"
                        onClick={() => router.push('/dashboard/courses')}
                        className="mx-auto"
                        size="lg"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Courses
                    </Button>
                </div>
            </div>
        );
    }

    const batchOptions = getBatchOptions();

    return (
        <div className="space-y-6">
            {/* Header with Student Info */}
            <div>
                <div className="mt-3 flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 rounded-xl border border-primary-200 dark:border-primary-800">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-body-muted truncate">Enrolling in {course.name}</p>
                        <p className="font-semibold text-heading truncate">{selectedStudent.name}</p>
                        
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <Formik
                initialValues={{
                    studentId: selectedStudent.id,
                    batchId: '',
                    startMonth: availableMonths[0]?.value || '',
                    couponCode: initialCouponCode,
                }}
                validationSchema={EnrollmentSchema}
                onSubmit={handleEnrollment}
                enableReinitialize
            >
                {({ values, setFieldValue, isValid, errors, touched }) => (
                    <Form>
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Side - Form Fields */}
                            <div className="flex-1 min-w-0 bg-card rounded-card border shadow-card p-4 sm:p-6">
                                <div className="space-y-5">
                                    {/* Form Error Message */}
                                    {formError && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-red-700 dark:text-red-300">Something went wrong</p>
                                                <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-line">{formError}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Batch Selection - Custom Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-heading">Batch *</label>
                                        <Select
                                            name="batchId"
                                            options={batchOptions}
                                            value={values.batchId}
                                            onChange={(val) => setFieldValue('batchId', val)}
                                            placeholder="Select a batch"
                                            error={!!(errors.batchId && touched.batchId)}
                                        />
                                        <ErrorMessage
                                            name="batchId"
                                            component="div"
                                            className="text-red-500 text-xs"
                                        />
                                    </div>

                                    {/* Start Month - Custom Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-heading">Start From *</label>
                                        <Select
                                            name="startMonth"
                                            options={availableMonths}
                                            value={values.startMonth}
                                            onChange={(val) => setFieldValue('startMonth', val)}
                                            placeholder="Select start month"
                                            error={!!(errors.startMonth && touched.startMonth)}
                                        />
                                        <ErrorMessage
                                            name="startMonth"
                                            component="div"
                                            className="text-red-500 text-xs"
                                        />
                                    </div>

                                    {/* Available Coupons */}
                                    {publicCoupons.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-heading">
                                                Available Offers
                                            </label>
                                            <div className="space-y-2">
                                                {publicCoupons.map((coupon) => {
                                                    const isSelected = values.couponCode.toUpperCase() === coupon.code.toUpperCase();
                                                    return (
                                                        <div
                                                            key={coupon.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setFieldValue('couponCode', '');
                                                                    setCouponApplied(false);
                                                                    setCouponBenefits([]);
                                                                    setCouponError(null);
                                                                } else {
                                                                    setFieldValue('couponCode', coupon.code);
                                                                    validateCoupon(
                                                                        coupon.code,
                                                                        values.batchId ? Number(values.batchId) : undefined
                                                                    );
                                                                }
                                                            }}
                                                            className={`
                                                                p-3 border rounded-xl cursor-pointer transition-all relative overflow-hidden
                                                                ${isSelected
                                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                                                                    : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {/* Custom checkbox/radio */}
                                                                <div className={`
                                                                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                                                    ${isSelected 
                                                                        ? 'border-emerald-500 bg-emerald-500' 
                                                                        : 'border-neutral-300 dark:border-neutral-600'
                                                                    }
                                                                `}>
                                                                    {isSelected && (
                                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                                    )}
                                                                </div>
                                                                <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                                                                    <Ticket className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-sm text-heading">{coupon.code}</div>
                                                                    <div className="text-xs text-body-muted truncate">{coupon.offer_message || coupon.description}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Coupon Code - Manual Entry (validates on input) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-heading">
                                            Coupon Code (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={values.couponCode}
                                            onChange={(e) => handleCouponChange(e.target.value, setFieldValue, values.batchId ? Number(values.batchId) : undefined)}
                                            placeholder="Enter coupon code"
                                            className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all uppercase"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        {couponError && (
                                            <div className="text-red-500 text-xs">{couponError}</div>
                                        )}
                                        {couponApplied && (
                                            <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Coupon applied successfully!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile-only: Fee Summary & Buttons */}
                                <div className="lg:hidden mt-6 space-y-4">
                                    {/* Fee Summary */}
                                    <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 sm:p-5 rounded-2xl border border-secondary-200 dark:border-secondary-800">
                                        <h3 className="font-bold text-heading mb-4">Fee Summary</h3>

                                        <div className="space-y-3">
                                            {/* Admission Fee */}
                                            {(() => {
                                                const original = getOriginalFees(Number(values.batchId) || undefined);
                                                const calculated = calculateFees(Number(values.batchId) || undefined);
                                                const hasDiscount = couponApplied && original.admissionFee > calculated.admissionFee;
                                                const discountPercent = hasDiscount 
                                                    ? calculateDiscountPercent(original.admissionFee, calculated.admissionFee)
                                                    : 0;
                                                
                                                return (
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="text-body text-sm">
                                                            Admission Fee
                                                            {hasDiscount && (
                                                                <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    ({discountPercent}% off)
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-2 flex-shrink-0">
                                                            {hasDiscount && (
                                                                <span className="text-xs text-body-muted line-through">
                                                                    ৳{Math.round(original.admissionFee).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className={`text-sm ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                                                                ৳{Math.round(calculated.admissionFee).toLocaleString()}
                                                            </span>
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* First Month Tuition */}
                                            {(() => {
                                                const original = getOriginalFees(Number(values.batchId) || undefined);
                                                const calculated = calculateFees(Number(values.batchId) || undefined);
                                                const hasDiscount = couponApplied && original.tuitionFee > calculated.tuitionFee;
                                                const discountPercent = hasDiscount 
                                                    ? calculateDiscountPercent(original.tuitionFee, calculated.tuitionFee)
                                                    : 0;
                                                
                                                return (
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="text-body text-sm">
                                                            First Month
                                                            {hasDiscount && (
                                                                <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    ({discountPercent}% off)
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-2 flex-shrink-0">
                                                            {hasDiscount && (
                                                                <span className="text-xs text-body-muted line-through">
                                                                    ৳{Math.round(original.tuitionFee).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className={`text-sm ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                                                                ৳{Math.round(calculated.tuitionFee).toLocaleString()}
                                                            </span>
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Total */}
                                            {(() => {
                                                const original = getOriginalFees(Number(values.batchId) || undefined);
                                                const calculated = calculateFees(Number(values.batchId) || undefined);
                                                const hasAnyDiscount = couponApplied && original.total > calculated.total;
                                                const totalDiscountPercent = hasAnyDiscount 
                                                    ? calculateDiscountPercent(original.total, calculated.total)
                                                    : 0;

                                                return (
                                                    <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
                                                        <div className="flex justify-between items-start gap-2 font-bold text-heading">
                                                            <span className="text-sm">
                                                                Total Today
                                                                {hasAnyDiscount && totalDiscountPercent > 0 && (
                                                                    <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                        (Save {totalDiscountPercent}%)
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="flex items-center gap-2 flex-shrink-0">
                                                                {hasAnyDiscount && (
                                                                    <span className="text-xs text-body-muted line-through font-normal">
                                                                        ৳{Math.round(original.total).toLocaleString()}
                                                                    </span>
                                                                )}
                                                                <span className="text-primary text-base">
                                                                    ৳{Math.round(calculated.total).toLocaleString()}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Recurring Monthly Fee Note */}
                                            <div className="pt-2 text-xs text-body-muted">
                                                From 2nd month: ৳{Math.round(getRecurringMonthlyFee(Number(values.batchId) || undefined)).toLocaleString()}/month
                                            </div>
                                        </div>
                                    </div>

                                    {/* Important Info */}
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Pay Tuition fees by the 5th of each month.
                                        </p>
                                    </div>

                                    {/* Form Buttons - Stack on mobile */}
                                    <div className="flex flex-col gap-3 pt-2">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={enrolling || !isValid || !values.batchId}
                                            className="w-full"
                                        >
                                            {enrolling ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Proceed to Payment
                                                    <CreditCard className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/dashboard/courses')}
                                            className="w-full"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Fee Summary & Actions (Desktop only) */}
                            <div className="hidden lg:block lg:w-[360px] flex-shrink-0">
                                {/* Fee Summary Card */}
                                <div className="bg-card rounded-card border shadow-card p-6 sticky top-6">
                                    <h3 className="font-bold text-heading text-lg mb-5">Fee Summary</h3>

                                    <div className="space-y-4">
                                        {/* Admission Fee */}
                                        {(() => {
                                            const original = getOriginalFees(Number(values.batchId) || undefined);
                                            const calculated = calculateFees(Number(values.batchId) || undefined);
                                            const hasDiscount = couponApplied && original.admissionFee > calculated.admissionFee;
                                            const discountPercent = hasDiscount 
                                                ? calculateDiscountPercent(original.admissionFee, calculated.admissionFee)
                                                : 0;
                                            
                                            return (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-body">
                                                        Admission Fee
                                                        {hasDiscount && (
                                                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                ({discountPercent}% off)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        {hasDiscount && (
                                                            <span className="text-sm text-body-muted line-through">
                                                                ৳{Math.round(original.admissionFee).toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className={`font-medium ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                                            ৳{Math.round(calculated.admissionFee).toLocaleString()}
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* First Month Tuition */}
                                        {(() => {
                                            const original = getOriginalFees(Number(values.batchId) || undefined);
                                            const calculated = calculateFees(Number(values.batchId) || undefined);
                                            const hasDiscount = couponApplied && original.tuitionFee > calculated.tuitionFee;
                                            const discountPercent = hasDiscount 
                                                ? calculateDiscountPercent(original.tuitionFee, calculated.tuitionFee)
                                                : 0;
                                            
                                            return (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-body">
                                                        First Month Tuition
                                                        {hasDiscount && (
                                                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                ({discountPercent}% off)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        {hasDiscount && (
                                                            <span className="text-sm text-body-muted line-through">
                                                                ৳{Math.round(original.tuitionFee).toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className={`font-medium ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                                            ৳{Math.round(calculated.tuitionFee).toLocaleString()}
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Total */}
                                        {(() => {
                                            const original = getOriginalFees(Number(values.batchId) || undefined);
                                            const calculated = calculateFees(Number(values.batchId) || undefined);
                                            const hasAnyDiscount = couponApplied && original.total > calculated.total;
                                            const totalDiscountPercent = hasAnyDiscount 
                                                ? calculateDiscountPercent(original.total, calculated.total)
                                                : 0;

                                            return (
                                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                                    <div className="flex justify-between items-center font-bold text-heading">
                                                        <span>
                                                            Total Payable Today
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            {hasAnyDiscount && (
                                                                <span className="text-sm text-body-muted line-through font-normal">
                                                                    ৳{Math.round(original.total).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className="text-primary text-xl">
                                                                ৳{Math.round(calculated.total).toLocaleString()}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    {hasAnyDiscount && totalDiscountPercent > 0 && (
                                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-right">
                                                            You save {totalDiscountPercent}%!
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Recurring Monthly Fee Note */}
                                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                            <div className="flex justify-between items-center text-sm text-body-muted">
                                                <span>From 2nd month onwards:</span>
                                                <span className="font-medium">
                                                    ৳{Math.round(getRecurringMonthlyFee(Number(values.batchId) || undefined)).toLocaleString()}/month
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Important Info */}
                                    <div className="mt-5 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Tuition fees are due by the 5th of each month.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 space-y-3">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={enrolling || !isValid || !values.batchId}
                                            className="w-full"
                                        >
                                            {enrolling ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Proceed to Payment
                                                    <CreditCard className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/dashboard/courses')}
                                            className="w-full"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
