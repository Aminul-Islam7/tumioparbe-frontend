'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { courseApi, enrollmentApi, userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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
    Users,
} from 'lucide-react';

export default function CoursesPage() {
    const { user } = useAuth(true);
    const router = useRouter();
    const searchParams = useSearchParams();


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

            // Auto-select student based on URL query param or first student
            // Use functional update to avoid dependency on selectedStudentId
            setSelectedStudentId((currentSelectedId) => {
                // Only set if not already selected
                if (currentSelectedId !== null) {
                    return currentSelectedId;
                }
                
                if (fetchedStudents.length === 0) {
                    return null;
                }
                
                // Check if there's a studentId in URL query parameters
                const urlParams = new URLSearchParams(window.location.search);
                const urlStudentId = urlParams.get('studentId');
                if (urlStudentId) {
                    const studentIdNum = parseInt(urlStudentId, 10);
                    // Check if this student exists in the fetched list
                    const studentExists = fetchedStudents.some((s) => s.id === studentIdNum);
                    if (studentExists) {
                        return studentIdNum;
                    }
                }
                
                // Fall back to first student
                return fetchedStudents[0].id;
            });
        } catch (err) {
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Copy link to clipboard
    const copyLink = async (link: string, label: string = 'Link') => {
        try {
            await navigator.clipboard.writeText(link);
            // Link copied successfully
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading courses...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-card border-2 border-amber-200 dark:border-amber-800 p-8 text-center shadow-card">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">Error Loading Data</h2>
                    <p className="text-body-muted mb-6">{error}</p>

                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="warning"
                        size="lg"
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
                <div className="bg-card-courses-bg border-2 border-card-courses-border rounded-card p-12 text-center shadow-card">
                    <div className="h-20 w-20 bg-secondary-200 dark:bg-secondary-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <UserPlus className="h-10 w-10 text-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-3">No Children Added Yet</h2>
                    <p className="text-body-muted mb-6 max-w-md mx-auto">
                        You need to add at least one child before you can enroll them in courses.
                    </p>
                    <Link href="/dashboard/students">
                        <Button variant="secondary" size="lg">
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


            {/* Student Selector - Pill Buttons */}
            <div className="bg-card rounded-card border shadow-card p-4 sm:p-5">
                <p className="text-sm font-medium text-body-muted mb-4 text-center md:text-left">Select a child:</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {students.map((student) => {
                        const isSelected = selectedStudentId === student.id;
                        return (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.id)}
                                className={`
                                    flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all duration-fast
                                    ${
                                        isSelected
                                            ? 'border-secondary bg-secondary-100 dark:bg-secondary-900/30 text-secondary shadow-sky'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-secondary/50 hover:bg-secondary-50 dark:hover:bg-secondary-900/10'
                                    }
                                `}
                            >
                                <div
                                    className={`
                                    h-8 w-8 rounded-full flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-secondary text-white' : 'bg-neutral-100 dark:bg-neutral-700'}
                                `}
                                >
                                    <User className="h-4 w-4" />
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-secondary' : 'text-heading'}`}>
                                    {student.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div className="bg-card rounded-card border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-8 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-body-muted" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">No Courses Available</h2>
                    <p className="text-body-muted">
                        There are no courses available at the moment. Please check back later.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                    {courses.map((course) => {
                        const isEnrolled = isEnrolledInCourse(course.id);
                        const { enrollment, batch } = getEnrollmentForCourse(course.id);
                        const monthlyFee = getMonthlyFee(course.id);

                        return (
                            <div
                                key={course.id}
                                className={`
                                    rounded-card border-2 overflow-hidden flex flex-col transition-all duration-normal group
                                    ${
                                        isEnrolled
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:shadow-lime'
                                            : 'bg-card-courses-bg border-card-courses-border hover:shadow-sky'
                                    }
                                `}
                            >
                                {/* Enrolled Badge */}
                                {isEnrolled && (
                                    <div className="bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
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
                                            <div className="flex justify-between items-center text-sm bg-white/60 dark:bg-secondary-900/40 p-2.5 rounded-lg">
                                                <span>Admission Fee</span>
                                                <span className="font-medium">৳{Math.round(course.admission_fee)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm bg-white/60 dark:bg-secondary-900/40 p-2.5 rounded-lg">
                                            <span>Monthly Fee</span>
                                            <span className="font-medium">৳{Math.round(monthlyFee)}</span>
                                        </div>
                                        {!isEnrolled && (
                                            <div className="flex justify-between items-center text-sm bg-white/60 dark:bg-secondary-900/40 p-2.5 rounded-lg">
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
                                                            className="flex-1 text-sm text-secondary hover:underline truncate flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                                            <span className="truncate">{batch.class_link}</span>
                                                        </a>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyLink(batch.class_link!, 'Class link')}
                                                            className="flex-shrink-0 border-secondary text-secondary hover:bg-secondary-50 dark:hover:bg-secondary-900/20"
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Group Link */}
                                            {batch.group_link && (
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                                        Group Link
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={batch.group_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 text-sm text-secondary hover:underline truncate flex items-center gap-1"
                                                        >
                                                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                                            <span className="truncate">{batch.group_link}</span>
                                                        </a>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyLink(batch.group_link!, 'Group link')}
                                                            className="flex-shrink-0 border-secondary text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-900/60"
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
                                            <div className="bg-white/60 dark:bg-secondary-900/40 rounded-lg p-2.5 space-y-1.5 max-h-[130px] overflow-y-auto">
                                                {course.batches
                                                    .filter((batch) => batch.is_visible)
                                                    .map((batch) => (
                                                        <div
                                                            key={batch.id}
                                                            className="flex items-center text-xs p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
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
                                            className="w-full border-secondary text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-900/60"
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
                                            className="w-full"
                                            variant="secondary"
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
