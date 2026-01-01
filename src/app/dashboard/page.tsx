'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { paymentApi, userApi, enrollmentApi, courseApi } from '@/lib/api';
import { Invoice, Student, Enrollment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import {
    CreditCard,
    User,
    Users,
    BookOpen,
    AlertCircle,
    CheckCircle,
    Loader2,
    UserPlus,
    GraduationCap,
    UserCircle,
    Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth(true);
    const router = useRouter();
    const { showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);

    const hasFetched = useRef(false);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [invoicesRes, studentsRes, enrollmentsRes, coursesRes] = await Promise.all([
                paymentApi.getPendingInvoices(),
                userApi.getStudents(),
                enrollmentApi.getEnrollments(),
                courseApi.getCourses(),
            ]);

            // Parse responses
            const invoices = Array.isArray(invoicesRes.data)
                ? invoicesRes.data
                : invoicesRes.data?.results || [];

            const studentsData = Array.isArray(studentsRes.data)
                ? studentsRes.data
                : studentsRes.data?.results || [];

            const enrollmentsData = Array.isArray(enrollmentsRes.data)
                ? enrollmentsRes.data
                : enrollmentsRes.data?.results || [];

            const coursesData = Array.isArray(coursesRes.data)
                ? coursesRes.data
                : coursesRes.data?.results || [];

            setPendingInvoices(invoices);
            setStudents(studentsData);
            setEnrollments(enrollmentsData);
            setCourses(coursesData);
        } catch (error) {
            showError('Error', 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate total due
    const totalDue = pendingInvoices.reduce(
        (sum, inv) => sum + parseFloat(String(inv.amount)),
        0
    );

    // Get active enrollments
    const activeEnrollments = enrollments.filter((e) => e.is_active);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-primary to-lavender flex items-center justify-center shadow-bubblegum shrink-0">
                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-heading">
                        Welcome back, {user?.name}!
                    </h1>
                    <p className="text-body-muted">Here&apos;s what&apos;s happening today</p>
                </div>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Total Due Card - Tangerine themed */}
                <div className="bg-card-achievements-bg border-2 border-card-achievements-border rounded-card p-4 sm:p-6 hover:shadow-tangerine transition-all duration-normal group min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-tangerine-200 dark:bg-tangerine-800/50 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-tangerine-600 dark:text-tangerine-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-heading">
                                ৳{totalDue.toLocaleString()}
                            </h3>
                            <p className="text-sm text-body-muted">Total Due</p>
                        </div>
                    </div>

                    {pendingInvoices.length > 0 ? (
                        <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-800/30 border border-amber-300 dark:border-amber-700">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <span className="font-semibold text-amber-800 dark:text-amber-200">
                                    {pendingInvoices.length} Pending Payment
                                    {pendingInvoices.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Please pay your invoices to continue your child's enrollment
                            </p>
                        </div>
                    ) : (
                        <div className="mb-5 p-4 rounded-xl bg-emerald-100/40 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                                    All Payments Clear!
                                </span>
                            </div>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                You have no pending payments
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/payments" className="block">
                        <Button variant="tangerine" className="w-full" size="lg">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {pendingInvoices.length > 0 ? 'Pay Now' : 'View Payments'}
                        </Button>
                    </Link>
                </div>

                {/* My Children Card - Lavender themed (matches sidebar) */}
                <div className="bg-card-assignments-bg border-2 border-card-assignments-border rounded-card p-4 sm:p-6 hover:shadow-lavender transition-all duration-normal group min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-lavender-200 dark:bg-lavender-800/50 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-lavender-600 dark:text-lavender-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-heading">{students.length}</h3>
                            <p className="text-sm text-body-muted">
                                {students.length === 1 ? 'Child' : 'Children'}
                            </p>
                        </div>
                    </div>

                    {students.length > 0 ? (
                        <div className="mb-5 p-4 rounded-xl bg-lavender-50 dark:bg-lavender-800/40">
                            <div className="space-y-2">
                                {students.slice(0, 4).map((student) => (
                                    <div key={student.id} className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-lavender-200 dark:bg-lavender-700/50 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-lavender-600 dark:text-lavender-400" />
                                        </div>
                                        <p className="font-medium text-sm text-heading truncate">
                                            {student.name}
                                        </p>
                                    </div>
                                ))}
                                {students.length > 4 && (
                                    <p className="text-sm text-lavender-600 dark:text-lavender-400 text-center pt-1">
                                        +{students.length - 4} more
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-5 p-4 rounded-xl bg-lavender-50 dark:bg-lavender-800/40">
                            <p className="text-sm text-body-muted text-center">
                                No children added yet
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/students" className="block">
                        <Button variant="lavender" className="w-full" size="lg">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {students.length > 0 ? 'Manage Children' : 'Add a Child'}
                        </Button>
                    </Link>
                </div>

                {/* Enrolled Courses Card - Sky Blue themed (matches sidebar) */}
                <div className="bg-card-courses-bg border-2 border-card-courses-border rounded-card p-4 sm:p-6 hover:shadow-sky transition-all duration-normal group min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-secondary-200 dark:bg-secondary-800/50 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-secondary-600 dark:text-secondary-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-heading">
                                {activeEnrollments.length > 0
                                    ? Array.from(
                                          new Set(
                                              activeEnrollments
                                                  .map((e) => {
                                                      const course = courses.find((c) =>
                                                          c.batches.some((b) => b.id === e.batch)
                                                      );
                                                      return course?.id;
                                                  })
                                                  .filter((id) => id !== undefined)
                                          )
                                      ).length
                                    : 0}
                            </h3>
                            <p className="text-sm text-body-muted">Enrolled Courses</p>
                        </div>
                    </div>

                    {activeEnrollments.length > 0 ? (
                        <div className="mb-5 space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                            {(() => {
                                // Group enrollments by course
                                const courseGroups = new Map<number, typeof activeEnrollments>();
                                activeEnrollments.forEach((enrollment) => {
                                    const course = courses.find((c) =>
                                        c.batches.some((b) => b.id === enrollment.batch)
                                    );
                                    if (course) {
                                        if (!courseGroups.has(course.id)) {
                                            courseGroups.set(course.id, []);
                                        }
                                        courseGroups.get(course.id)!.push(enrollment);
                                    }
                                });

                                return Array.from(courseGroups.entries())
                                    .slice(0, 3)
                                    .map(([courseId, courseEnrollments]) => {
                                        const course = courses.find((c) => c.id === courseId);
                                        if (!course) return null;

                                        return (
                                            <div
                                                key={courseId}
                                                className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800/40"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <GraduationCap className="h-4 w-4 text-secondary-600 dark:text-secondary-400 flex-shrink-0" />
                                                    <p className="font-semibold text-sm text-secondary-800 dark:text-secondary-200 truncate">
                                                        {course.name}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-secondary-600 dark:text-secondary-400 ml-6">
                                                    {courseEnrollments.length} child
                                                    {courseEnrollments.length !== 1 ? 'ren' : ''}{' '}
                                                    enrolled
                                                </p>
                                            </div>
                                        );
                                    });
                            })()}
                        </div>
                    ) : (
                        <div className="mb-5 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800/40">
                            <p className="text-sm text-body-muted text-center">
                                No active enrollments yet
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/courses" className="block">
                        <Button variant="secondary" className="w-full" size="lg">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Browse Courses
                        </Button>
                    </Link>
                </div>

                {/* Profile Card - Primary themed */}
                <div className="bg-card-profile-bg border-2 border-card-profile-border rounded-card p-4 sm:p-6 hover:shadow-bubblegum transition-all duration-normal group min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary-200 dark:bg-primary-800/50 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <UserCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-heading truncate">
                                {user?.name}
                            </h3>
                            <p className="text-sm text-body-muted">Your Profile</p>
                        </div>
                    </div>

                    <div className="mb-5 p-4 rounded-xl bg-primary-50 dark:bg-primary-800/30 space-y-3">
                        {user?.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-body-muted">Email:</span>
                                <span className="font-medium text-heading truncate">
                                    {user.email}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-body-muted">Phone:</span>
                            <span className="font-medium text-heading">
                                {user?.phone || 'Not set'}
                            </span>
                        </div>
                        {user?.facebook_profile && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-body-muted">Facebook:</span>
                                <span className="font-medium text-heading truncate">
                                    {user.facebook_profile}
                                </span>
                            </div>
                        )}
                    </div>

                    <Link href="/dashboard/profile" className="block">
                        <Button className="w-full" size="lg">
                            <UserCircle className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
