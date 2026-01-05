'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { courseApi, userApi, enrollmentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

import { Course, Batch, Student } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    CreditCard,
    Tag,
    Clock,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

// Validation schema
const EnrollmentSchema = Yup.object().shape({
    studentId: Yup.number().required('Student is required'),
    batchId: Yup.number().required('Batch is required'),
    startMonth: Yup.string().required('Start month is required'),
    couponCode: Yup.string(),
});

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
    const [availableMonths, setAvailableMonths] = useState<
        {
            value: string;
            label: string;
        }[]
    >([]);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch students
                const studentsResponse = await userApi.getStudents();
                const fetchedStudents = studentsResponse.data.results || [];
                setStudents(fetchedStudents);

                // Fetch course details if course ID is provided
                if (courseIdParam) {
                    const courseResponse = await courseApi.getCourse(parseInt(courseIdParam));
                    setCourse(courseResponse.data);
                }

                // Generate available months (current month + 2 future months)
                const now = new Date();
                const months = [];

                for (let i = 0; i < 3; i++) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const value = monthDate.toISOString().substring(0, 7); // YYYY-MM format
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
    }, [courseIdParam]);

    // Get visible batches
    const getVisibleBatches = () => {
        if (!course) return [];
        return course.batches.filter((batch) => batch.is_visible);
    };

    // Handle coupon validation
    const validateCoupon = async (code: string, batchId?: number) => {
        try {
            const response = await enrollmentApi.validateCoupon(code, { batch_id: batchId });

            if (response.data.valid) {
                setCouponApplied(true);
                setCouponDiscount(response.data.discount);
                return true;
            } else {
                setCouponApplied(false);
                setCouponDiscount(0);
                return false;
            }
        } catch (error) {
            console.error('Failed to validate coupon:', error);
            return false;
        }
    };

    // Calculate fee details
    const calculateFees = (batchId: number | undefined) => {
        if (!course || !batchId) {
            return {
                admissionFee: 0,
                tuitionFee: 0,
                total: 0,
            };
        }

        const selectedBatch = course.batches.find((b) => b.id === batchId);
        const admissionFee = course.admission_fee;
        const tuitionFee = selectedBatch?.tuition_fee || course.monthly_fee;

        // Apply coupon discount if applicable
        const discountedAdmission = couponApplied
            ? admissionFee * (1 - couponDiscount / 100)
            : admissionFee;
        const discountedTuition = couponApplied
            ? tuitionFee * (1 - couponDiscount / 100)
            : tuitionFee;

        return {
            admissionFee: discountedAdmission,
            tuitionFee: discountedTuition,
            total: discountedAdmission + discountedTuition,
        };
    };

    // Handle enrollment
    const handleEnrollment = async (values: any) => {
        try {
            setEnrolling(true);

            // Prepare enrollment data
            const enrollmentData = {
                student: values.studentId,
                batch: values.batchId,
                start_month: values.startMonth,
                coupon_code: values.couponCode || undefined,
            };

            // Initiate enrollment
            const enrollmentResponse = await enrollmentApi.initiateEnrollment(enrollmentData);

            if (enrollmentResponse.data) {
                const enrollment = enrollmentResponse.data;

                // Initiate payment
                const paymentResponse = await enrollmentApi.initiatePayment({
                    enrollment_id: enrollment.id,
                    amount: calculateFees(values.batchId).total,
                });

                if (paymentResponse.data) {
                    // Enrollment successful, redirect to payment

                    // Redirect to payment page or handle as needed
                    // This should be replaced with actual code to handle the payment gateway
                    setTimeout(() => {
                        // In a real implementation, redirect to payment gateway URL
                        router.push(`/dashboard/courses?student=${values.studentId}`);
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Failed to complete enrollment:', error);
        } finally {
            setEnrolling(false);
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

    const visibleBatches = getVisibleBatches();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-heading">Enroll in Course</h1>
                <p className="text-body-muted mt-2">
                    Complete your enrollment for {course.name}
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Enrollment Form */}
                <div className="flex-1 bg-card rounded-card border shadow-card p-6">
                    <Formik
                        initialValues={{
                            studentId: parseInt(studentIdParam || '') || '',
                            batchId: '',
                            startMonth: availableMonths[0]?.value || '',
                            couponCode: '',
                        }}
                        validationSchema={EnrollmentSchema}
                        onSubmit={handleEnrollment}
                    >
                        {({ values, setFieldValue, isValid, dirty }) => (
                            <Form className="space-y-6">
                                {/* Student Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-heading">Select Student *</label>
                                    <Field
                                        as="select"
                                        name="studentId"
                                        className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                                    >
                                        <option value="">Select a student</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.name}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage
                                        name="studentId"
                                        component="div"
                                        className="text-error text-xs"
                                    />
                                </div>

                                {/* Batch Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-heading">Select Batch *</label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {visibleBatches.map((batch) => (
                                            <label
                                                key={batch.id}
                                                                                        className={`
                                                    flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all
                                                    ${Number(values.batchId) === batch.id ? 'border-primary bg-primary-50 dark:bg-primary-900/20 shadow-bubblegum' : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-200 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'}
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">
                                                        {batch.name}
                                                    </span>
                                                    <input
                                                        type="radio"
                                                        name="batchId"
                                                        value={batch.id}
                                                        checked={Number(values.batchId) === batch.id}
                                                        onChange={() => setFieldValue('batchId', batch.id)}
                                                        className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary"
                                                    />
                                                </div>
                                                <div className="mt-2 text-sm text-body-muted flex items-center">
                                                    <Clock className="h-3.5 w-3.5 mr-1.5 text-secondary" />
                                                    {batch.timing}
                                                </div>
                                                {batch.tuition_fee &&
                                                    batch.tuition_fee !== course.monthly_fee && (
                                                <div className="mt-1 text-sm text-body-muted flex items-center">
                                                            <Tag className="h-3.5 w-3.5 mr-1.5 text-tangerine-500" />
                                                            Special Fee: ৳{Math.round(batch.tuition_fee)}/month
                                                        </div>
                                                    )}
                                            </label>
                                        ))}
                                    </div>
                                    <ErrorMessage
                                        name="batchId"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Start Month */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-heading">Start From *</label>
                                    <Field
                                        as="select"
                                        name="startMonth"
                                        className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                                    >
                                        {availableMonths.map((month) => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage
                                        name="startMonth"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Coupon Code */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-heading">
                                        Coupon Code (Optional)
                                    </label>
                                    <div className="flex gap-3">
                                        <Field
                                            name="couponCode"
                                            type="text"
                                            placeholder="Enter coupon code"
                                            className="flex-1 h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={!values.couponCode}
                                            onClick={() =>
                                                validateCoupon(
                                                    values.couponCode,
                                                    values.batchId ? Number(values.batchId) : undefined
                                                )
                                            }
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    <ErrorMessage
                                        name="couponCode"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Fee Details */}
                                <div className="bg-secondary-50 dark:bg-secondary-900/20 p-5 rounded-2xl border border-secondary-200 dark:border-secondary-800">
                                    <h3 className="font-bold text-heading mb-4">Fee Details</h3>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Admission Fee</span>
                                            <span>
                                                ৳
                                                {Math.round(calculateFees(Number(values.batchId) || undefined).admissionFee).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>First Month Tuition</span>
                                            <span>
                                                ৳
                                                {Math.round(calculateFees(Number(values.batchId) || undefined).tuitionFee).toLocaleString()}
                                            </span>
                                        </div>

                                        {couponApplied && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                                <span>Coupon Discount</span>
                                                <span>{couponDiscount}% off</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 flex justify-between font-bold text-heading">
                                            <span>Total Payable</span>
                                            <span className="text-primary">
                                                ৳
                                                {Math.round(calculateFees(Number(values.batchId) || undefined).total).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Buttons */}
                                <div className="flex justify-between pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/dashboard/courses')}
                                        size="lg"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={enrolling || !isValid}
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
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>

                {/* Course Details */}
                <div className="lg:w-1/3 bg-card-courses-bg border-2 border-card-courses-border rounded-card p-6 shadow-card">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-heading">{course.name}</h2>
                            {course.description && (
                                <p className="text-body-muted text-sm mt-2">
                                    {course.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm">Admission Fee</span>
                                <span className="font-medium">
                                    ৳{Math.round(course.admission_fee).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm">Monthly Tuition Fee</span>
                                <span className="font-medium">
                                    ৳{Math.round(course.monthly_fee).toLocaleString()}/month
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm">Available Batches</span>
                                <span className="font-medium">{visibleBatches.length}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-secondary-200 dark:border-secondary-800">
                            <h3 className="font-semibold text-heading mb-3">Enrollment Process</h3>
                            <ol className="space-y-3 text-sm text-body-muted">
                                <li className="flex items-start gap-2">
                                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <span>Select student, batch, and start month</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-secondary-100 dark:bg-secondary-900/30 text-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <span>Apply coupon code if available</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-tangerine-100 dark:bg-tangerine-900/30 text-tangerine-600 dark:text-tangerine-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                        3
                                    </span>
                                    <span>Complete payment to finalize enrollment</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                        4
                                    </span>
                                    <span>Access course materials and join class</span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <h3 className="font-semibold text-heading mb-2 flex items-center">
                                <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                                Important Information
                            </h3>
                            <ul className="space-y-2 text-sm text-body-muted">
                                <li>• Classes begin from the 1st of the selected month</li>
                                <li>• Tuition fees are due by the 5th of each month</li>
                                <li>• Course materials will be available after enrollment</li>
                                <li>• You can contact support for any assistance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
