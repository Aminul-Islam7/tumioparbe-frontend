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
    ArrowRight,
    Loader2,
    UserPlus,
    GraduationCap,
    UserCircle,
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
            console.error('Failed to fetch dashboard data:', error);
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
                <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Text */}
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>

            {/* Enhanced Stats Grid - Large Cards with Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Total Due Card - First */}
                <div className="bg-background rounded-xl border-2 p-8 hover:shadow-xl transition-all hover:border-orange-200 dark:hover:border-orange-800 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold mb-1">৳{totalDue.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground">Total Due</p>
                        </div>
                    </div>

                    {pendingInvoices.length > 0 ? (
                        <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    {pendingInvoices.length} Pending Payment{pendingInvoices.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Please pay your invoices to continue your child's enrollment
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    All Payments Clear!
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                You have no pending payments
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/payments" className="block mt-auto">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {pendingInvoices.length > 0 ? 'Pay Now' : 'View Payments'}
                        </Button>
                    </Link>
                </div>

                {/* My Children Card - Second */}
                <div className="bg-background rounded-xl border-2 p-8 hover:shadow-xl transition-all hover:border-blue-200 dark:hover:border-blue-800 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold mb-1">{students.length}</h3>
                            <p className="text-sm text-muted-foreground">
                                {students.length === 1 ? 'Child' : 'Children'}
                            </p>
                        </div>
                    </div>
                    
                    {students.length > 0 ? (
                        <div className="mb-6 p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                {students.slice(0, 5).map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                            <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="font-medium text-sm truncate">{student.name}</p>
                                    </div>
                                ))}
                                {students.length > 5 && (
                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                        +{students.length - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground text-center">
                                No students added yet
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/students" className="block mt-auto">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {students.length > 0 ? 'Manage Children' : 'Add a Child'}
                        </Button>
                    </Link>
                </div>

                {/* Enrolled Courses Card - Third */}
                <div className="bg-background rounded-xl border-2 p-8 hover:shadow-xl transition-all hover:border-purple-200 dark:hover:border-purple-800 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold mb-1">
                                {activeEnrollments.length > 0 
                                    ? Array.from(new Set(activeEnrollments.map(e => {
                                        const course = courses.find(c => c.batches.some(b => b.id === e.batch));
                                        return course?.id;
                                    }).filter(id => id !== undefined))).length
                                    : 0
                                }
                            </h3>
                            <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                        </div>
                    </div>

                    {activeEnrollments.length > 0 ? (
                        <div className="mb-6 space-y-3 max-h-[200px] overflow-y-auto">
                            {(() => {
                                // Group enrollments by course
                                const courseGroups = new Map<number, typeof activeEnrollments>();
                                activeEnrollments.forEach(enrollment => {
                                    const course = courses.find(c => c.batches.some(b => b.id === enrollment.batch));
                                    if (course) {
                                        if (!courseGroups.has(course.id)) {
                                            courseGroups.set(course.id, []);
                                        }
                                        courseGroups.get(course.id)!.push(enrollment);
                                    }
                                });

                                return Array.from(courseGroups.entries()).map(([courseId, enrollments]) => {
                                    const course = courses.find(c => c.id === courseId);
                                    if (!course) return null;

                                    return (
                                        <div key={courseId} className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                                    {course.name}
                                                </p>
                                            </div>
                                            <div className="space-y-1 ml-6">
                                                {enrollments.map(enrollment => {
                                                    const student = students.find(s => s.id === enrollment.student);
                                                    const batch = course.batches.find(b => b.id === enrollment.batch);
                                                    return (
                                                        <p key={enrollment.id} className="text-xs text-purple-700 dark:text-purple-300">
                                                            {student?.name} ({batch?.name} batch)
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        <div className="mb-6 p-4 rounded-lg bg-muted/30 text-center">
                            <p className="text-sm text-muted-foreground">
                                No active enrollments yet
                            </p>
                        </div>
                    )}

                    <Link href="/dashboard/courses" className="block mt-auto">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Browse Courses
                        </Button>
                    </Link>
                </div>

                {/* Profile Card - Fourth */}
                <div className="bg-background rounded-xl border-2 p-8 hover:shadow-xl transition-all hover:border-gray-200 dark:hover:border-gray-700 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <UserCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold mb-1 truncate">{user?.name}</h3>
                            <p className="text-sm text-muted-foreground">Your Profile</p>
                        </div>
                    </div>

                    <div className="mb-6 space-y-3">
                        {user?.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium truncate">{user.email}</span>
                            </div>
                        )}
                        {user?.facebook_profile && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Facebook:</span>
                                <span className="font-medium truncate">{user.facebook_profile}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{user?.phone || 'Not set'}</span>
                        </div>
                    </div>

                    <Link href="/dashboard/profile" className="block mt-auto">
                        <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                            <UserCircle className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
