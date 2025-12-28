'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { courseApi, enrollmentApi, userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Course, Batch, Student, Enrollment } from '@/types';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Clock,
    User,
    Calendar,
    ArrowRight,
    Loader2,
    AlertTriangle,
    RefreshCcw,
    UserPlus,
    CheckCircle2,
    Copy,
    ExternalLink,
} from 'lucide-react';

export default function CoursesPage() {
    const { user } = useAuth(true);
    const router = useRouter();
    const { showSuccess, showError } = useToast();

    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Data states
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

    // UI state
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    // Track if initial fetch has been done
    const hasFetched = useRef(false);

    // Fetch all data
    const fetchData = useCallback(async (showLoadingState = true) => {
        if (showLoadingState) {
            setIsLoading(true);
        }
        setError(null);

        try {
            // Fetch all data in parallel
            const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
                userApi.getStudents(),
                courseApi.getCourses(),
                enrollmentApi.getEnrollments(),
            ]);

            // Parse students
            const fetchedStudents: Student[] = Array.isArray(studentsRes.data)
                ? studentsRes.data
                : studentsRes.data?.results || [];

            // Parse courses
            const fetchedCourses: Course[] = Array.isArray(coursesRes.data)
                ? coursesRes.data
                : coursesRes.data?.results || [];

            // Parse enrollments
            const fetchedEnrollments: Enrollment[] = Array.isArray(enrollmentsRes.data)
                ? enrollmentsRes.data
                : enrollmentsRes.data?.results || [];

            // Update state
            setStudents(fetchedStudents);
            setCourses(fetchedCourses);
            setEnrollments(fetchedEnrollments);

            // Auto-select first student if available and none selected
            if (fetchedStudents.length > 0 && !selectedStudentId) {
                setSelectedStudentId(fetchedStudents[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedStudentId]);

    // Initial data fetch - only once when user is available
    useEffect(() => {
        if (user && !hasFetched.current) {
            hasFetched.current = true;
            fetchData();
        }
    }, [user, fetchData]);

    // Refresh data
    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData(false);
    };

    // Get selected student
    const selectedStudent = useMemo(() => {
        return students.find((s) => s.id === selectedStudentId) || null;
    }, [students, selectedStudentId]);

    // Get enrollment info for a course (for the selected student)
    const getEnrollmentForCourse = useCallback(
        (courseId: number): { enrollment: Enrollment | null; batch: Batch | null } => {
            if (!selectedStudentId) return { enrollment: null, batch: null };

            // Find the course
            const course = courses.find((c) => c.id === courseId);
            if (!course) return { enrollment: null, batch: null };

            // Find enrollment for this student in any batch of this course
            for (const batch of course.batches) {
                const enrollment = enrollments.find(
                    (e) => e.student === selectedStudentId && e.batch === batch.id
                );
                if (enrollment) {
                    return { enrollment, batch };
                }
            }

            return { enrollment: null, batch: null };
        },
        [selectedStudentId, courses, enrollments]
    );

    // Check if student is enrolled in a course
    const isEnrolledInCourse = useCallback(
        (courseId: number): boolean => {
            const { enrollment } = getEnrollmentForCourse(courseId);
            return enrollment !== null;
        },
        [getEnrollmentForCourse]
    );

    // Get the monthly fee for an enrollment (considering overrides)
    const getMonthlyFee = useCallback(
        (courseId: number): number => {
            const course = courses.find((c) => c.id === courseId);
            if (!course) return 0;

            const { enrollment, batch } = getEnrollmentForCourse(courseId);

            // If enrolled, check for individual override first, then batch override
            if (enrollment) {
                // Individual enrollment fee override
                if (enrollment.tuition_fee !== undefined && enrollment.tuition_fee !== null) {
                    return enrollment.tuition_fee;
                }
                // Batch fee override
                if (batch?.tuition_fee !== undefined && batch.tuition_fee !== null) {
                    return batch.tuition_fee;
                }
            }

            // Default course monthly fee
            return course.monthly_fee || 0;
        },
        [courses, getEnrollmentForCourse]
    );

    // Copy class link to clipboard
    const copyClassLink = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            showSuccess('Copied!', 'Class link copied to clipboard');
        } catch (err) {
            showError('Error', 'Failed to copy link');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                <p className="text-muted-foreground">Loading courses...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Courses</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your course enrollments
                    </p>
                </div>

                <div className="bg-background rounded-lg border p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>

                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-tp_red hover:bg-red-600 text-white"
                    >
                        {isRefreshing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // No students added - prompt to add child
    if (students.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Courses</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your course enrollments
                    </p>
                </div>

                <div className="bg-background rounded-lg border p-12 text-center">
                    <div className="h-20 w-20 bg-tp_red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserPlus className="h-10 w-10 text-tp_red" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-3">No Children Added Yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        You need to add at least one child before you can enroll them in courses.
                        Go to the My Children page to add your first child.
                    </p>
                    <Link href="/dashboard/students">
                        <Button className="bg-tp_red hover:bg-red-600 text-white">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add a Child
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Courses</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your course enrollments
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                >
                    {isRefreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                </Button>
            </div>

            {/* Student Selector - Big Radio Buttons */}
            <div className="bg-background rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground mb-4">Select a child:</p>
                <div className="flex flex-wrap gap-3">
                    {students.map((student) => {
                        const isSelected = selectedStudentId === student.id;
                        return (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.id)}
                                className={`
                                    flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all duration-200
                                    ${
                                        isSelected
                                            ? 'border-tp_red bg-tp_red/10 text-tp_red shadow-md'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-tp_red/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }
                                `}
                            >
                                <div
                                    className={`
                                    h-8 w-8 rounded-full flex items-center justify-center
                                    ${isSelected ? 'bg-tp_red text-white' : 'bg-gray-100 dark:bg-gray-700'}
                                `}
                                >
                                    <User className="h-4 w-4" />
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-tp_red' : ''}`}>
                                    {student.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div className="bg-background rounded-lg border p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Courses Available</h2>
                    <p className="text-muted-foreground">
                        There are no courses available at the moment. Please check back later.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => {
                        const isEnrolled = isEnrolledInCourse(course.id);
                        const { enrollment, batch } = getEnrollmentForCourse(course.id);
                        const monthlyFee = getMonthlyFee(course.id);

                        return (
                            <div
                                key={course.id}
                                className={`
                                    rounded-lg border overflow-hidden flex flex-col transition-all
                                    ${
                                        isEnrolled
                                            ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                            : 'bg-background'
                                    }
                                `}
                            >
                                {/* Enrolled Badge */}
                                {isEnrolled && (
                                    <div className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>{selectedStudent?.name} is enrolled</span>
                                    </div>
                                )}

                                <div className="p-6 flex-1">
                                    <h3 className="text-lg font-semibold mb-2">{course.name}</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        {course.description || 'No description available.'}
                                    </p>

                                    <div className="space-y-2 mb-4">
                                        {/* Show admission fee only if NOT enrolled */}
                                        {!isEnrolled && (
                                            <div className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                                                <span>Admission Fee</span>
                                                <span className="font-medium">৳{course.admission_fee}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                                            <span>Monthly Fee</span>
                                            <span className="font-medium">৳{monthlyFee}</span>
                                        </div>
                                        {!isEnrolled && (
                                            <div className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                                                <span>Available Batches</span>
                                                <span className="font-medium">
                                                    {course.batches.filter((b) => b.is_visible).length}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Enrolled: Show batch info and class link */}
                                    {isEnrolled && batch && (
                                        <div className="space-y-3 pt-3 border-t">
                                            <div className="flex items-center text-sm">
                                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <div>
                                                    <span className="font-medium">{batch.name}</span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {batch.timing}
                                                    </p>
                                                </div>
                                            </div>

                                            {enrollment && (
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-medium">Started</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(enrollment.start_month).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Class Link */}
                                            {batch.class_link && (
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                                        Class Link
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={batch.class_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 text-sm text-tp_red hover:underline truncate flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                                            <span className="truncate">{batch.class_link}</span>
                                                        </a>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyClassLink(batch.class_link!)}
                                                            className="flex-shrink-0"
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Not enrolled: Show batches list */}
                                    {!isEnrolled && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Batches:</h4>
                                            <div className="bg-muted/30 rounded-md p-2 space-y-1.5 max-h-[130px] overflow-y-auto">
                                                {course.batches
                                                    .filter((batch) => batch.is_visible)
                                                    .map((batch) => (
                                                        <div
                                                            key={batch.id}
                                                            className="flex items-center text-xs p-1 rounded hover:bg-background/50"
                                                        >
                                                            <Clock className="h-3 w-3 mr-1.5" />
                                                            <span>{batch.name}: </span>
                                                            <span className="ml-1 text-muted-foreground">
                                                                {batch.timing}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-auto p-4 bg-muted/30 border-t">
                                    {isEnrolled ? (
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/payments?student=${selectedStudentId}`
                                                )
                                            }
                                            className="w-full"
                                            variant="outline"
                                        >
                                            Payment History
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/enroll?course=${course.id}&student=${selectedStudentId}`
                                                )
                                            }
                                            className="w-full bg-tp_red hover:bg-red-600 text-white"
                                        >
                                            Enroll {selectedStudent?.name}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
