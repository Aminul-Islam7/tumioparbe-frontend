'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { courseApi, enrollmentApi, userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useDataCache, clearCache } from '@/hooks/useDataCache';
import { Course, Batch, Student, Enrollment } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BookOpen,
    Clock,
    User,
    Calendar,
    ArrowRight,
    Loader2,
    AlertTriangle,
    RefreshCcw,
} from 'lucide-react';

// Mock data for testing when API returns empty results
const MOCK_STUDENTS = [
    {
        id: 1,
        parent: 0,
        name: 'Test Student 1',
        date_of_birth: '2010-01-01',
        school: 'Test School',
        current_class: 'Class 5',
        father_name: '',
        mother_name: '',
    },
    {
        id: 2,
        parent: 0,
        name: 'Test Student 2',
        date_of_birth: '2012-06-15',
        school: 'Another School',
        current_class: 'Class 3',
        father_name: '',
        mother_name: '',
    },
];

const MOCK_COURSES = [
    {
        id: 1,
        name: 'Mathematics Fundamentals',
        description: 'Basic mathematics skills for primary students',
        admission_fee: 1000,
        tuition_fee: 800,
        is_active: true,
        batches: [
            {
                id: 1,
                course: 1,
                name: 'Batch A',
                timing: 'Mon, Wed 4PM-5PM',
                tuition_fee: 800,
                is_visible: true,
                student_count: 0,
            },
            {
                id: 2,
                course: 1,
                name: 'Batch B',
                timing: 'Tue, Thu 5PM-6PM',
                tuition_fee: 800,
                is_visible: true,
                student_count: 0,
            },
        ],
    },
    {
        id: 2,
        name: 'English Language',
        description: 'English grammar and communication',
        admission_fee: 1000,
        tuition_fee: 900,
        is_active: true,
        batches: [
            {
                id: 3,
                course: 2,
                name: 'Morning Batch',
                timing: 'Sat, Sun 10AM-11AM',
                tuition_fee: 900,
                is_visible: true,
                student_count: 0,
            },
            {
                id: 4,
                course: 2,
                name: 'Evening Batch',
                timing: 'Sat, Sun 5PM-6PM',
                tuition_fee: 900,
                is_visible: true,
                student_count: 0,
            },
        ],
    },
];

const MOCK_ENROLLMENTS = [
    { id: 1, student: 1, batch: 1, start_month: '2023-09-01', tuition_fee: 800, is_active: true },
    { id: 2, student: 2, batch: 3, start_month: '2023-09-01', tuition_fee: 900, is_active: true },
];

export default function CoursesPage() {
    const { user } = useAuth(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentIdParam = searchParams.get('student');
    const { showSuccess, showError } = useToast();

    // UI state
    const [activeTab, setActiveTab] = useState('available'); // Default to available if no student selected
    const [selectedStudent, setSelectedStudent] = useState<number | null>(
        studentIdParam ? parseInt(studentIdParam) : null
    );
    // Set useMockData to false to use real API data
    const [useMockData, setUseMockData] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Function to refresh data by clearing caches
    const refreshData = async () => {
        try {
            setIsRefreshing(true);

            // Clear all relevant caches
            clearCache('dashboard-students');
            clearCache('dashboard-enrollments');
            clearCache('dashboard-courses');

            // Force page reload
            window.location.reload();
        } catch (error) {
            console.error('Error refreshing data:', error);
            showError('Error', 'Failed to refresh data');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Fetch students data with caching
    const {
        data: studentsData = [],
        isLoading: loadingStudents,
        error: studentsError,
        refetch: refetchStudents,
    } = useDataCache<Student[]>(
        'dashboard-students',
        async () => {
            // Don't use addDebugInfo here directly to prevent re-renders
            console.log('Fetching students...');

            try {
                const response = await userApi.getStudents();
                // Support both paginated responses ({ results: [...] }) and direct arrays
                const fetchedStudents = Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || [];

                console.log(`Found ${fetchedStudents.length} students`);

                // Return mock data if API returns empty and useMockData is true
                if (fetchedStudents.length === 0 && useMockData) {
                    console.log('Using mock student data');
                    return MOCK_STUDENTS;
                }

                return fetchedStudents;
            } catch (error) {
                console.error('Failed to fetch students:', error);

                // Return mock data on error if useMockData is enabled
                if (useMockData) {
                    console.log('Using mock student data after error');
                    return MOCK_STUDENTS;
                }
                throw error;
            }
        },
        [useMockData]
    );

    // Fetch enrollments data with caching
    const {
        data: enrollmentsData = [],
        isLoading: loadingEnrollments,
        error: enrollmentsError,
        refetch: refetchEnrollments,
    } = useDataCache<Enrollment[]>(
        'dashboard-enrollments',
        async () => {
            console.log('Fetching enrollments...');

            try {
                const response = await enrollmentApi.getEnrollments();
                // Support both paginated responses ({ results: [...] }) and direct arrays
                const fetchedEnrollments = Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || [];

                console.log(`Found ${fetchedEnrollments.length} enrollments`);

                // Return mock data if API returns empty and useMockData is true
                if (fetchedEnrollments.length === 0 && useMockData) {
                    console.log('Using mock enrollment data');
                    return MOCK_ENROLLMENTS;
                }

                return fetchedEnrollments;
            } catch (error) {
                console.error('Failed to fetch enrollments:', error);

                // Return mock data on error if useMockData is enabled
                if (useMockData) {
                    console.log('Using mock enrollment data after error');
                    return MOCK_ENROLLMENTS;
                }
                throw error;
            }
        },
        [useMockData]
    );

    // Fetch courses data with caching
    const {
        data: coursesData = [],
        isLoading: loadingCourses,
        error: coursesError,
        refetch: refetchCourses,
    } = useDataCache<Course[]>(
        'dashboard-courses',
        async () => {
            console.log('Fetching courses...');

            try {
                const response = await courseApi.getCourses();
                // Support both paginated responses ({ results: [...] }) and direct arrays
                const fetchedCourses = Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || [];

                console.log(`Found ${fetchedCourses.length} courses`);

                // Return mock data if API returns empty and useMockData is true
                if (fetchedCourses.length === 0 && useMockData) {
                    console.log('Using mock course data');
                    return MOCK_COURSES;
                }

                return fetchedCourses;
            } catch (error) {
                console.error('Failed to fetch courses:', error);

                // Return mock data on error if useMockData is enabled
                if (useMockData) {
                    console.log('Using mock course data after error');
                    return MOCK_COURSES;
                }
                throw error;
            }
        },
        [useMockData]
    );

    // Use the data safely (with proper names)
    const students = studentsData || [];
    const enrollments = enrollmentsData || [];
    const courses = coursesData || [];

    // Process enrolled courses data only when all required data is available
    const enrolledCourses = useMemo(() => {
        if (!students.length || !enrollments.length || !courses.length) {
            return [];
        }

        try {
            // Map enrollments to courses and students
            const processedEnrollments = enrollments.map((enrollment) => {
                const student = students.find((s) => s.id === enrollment.student);
                const matchingCourse = courses.find((course) =>
                    course.batches.some((batch) => batch.id === enrollment.batch)
                );
                const matchingBatch = matchingCourse?.batches.find(
                    (batch) => batch.id === enrollment.batch
                );

                return {
                    enrollmentId: enrollment.id,
                    studentId: student?.id || 0,
                    studentName: student?.name || 'Unknown Student',
                    courseId: matchingCourse?.id || 0,
                    courseName: matchingCourse?.name || 'Unknown Course',
                    batchId: matchingBatch?.id || 0,
                    batchName: matchingBatch?.name || 'Unknown Batch',
                    batchTiming: matchingBatch?.timing || '',
                    startDate: enrollment.start_month,
                    isActive: enrollment.is_active,
                };
            });

            return processedEnrollments;
        } catch (error) {
            console.error('Failed to process enrolled courses:', error);
            return [];
        }
    }, [students, enrollments, courses]);

    // Handle student selection
    const handleStudentChange = (studentId: number) => {
        setSelectedStudent(studentId);
        setActiveTab('enrolled'); // Switch to enrolled tab when a student is selected

        // Update URL with student ID without navigation
        const params = new URLSearchParams(window.location.search);
        params.set('student', studentId.toString());

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
    };

    // Get courses that the selected student is not enrolled in
    const availableCourses = useMemo(() => {
        if (!courses.length) {
            return [];
        }

        if (!selectedStudent) {
            return courses;
        }

        const enrolledCourseIds = enrolledCourses
            .filter((ec) => ec.studentId === selectedStudent)
            .map((ec) => ec.courseId);

        return courses.filter((course) => !enrolledCourseIds.includes(course.id));
    }, [selectedStudent, courses, enrolledCourses]);

    // Get enrolled courses for the selected student
    const studentEnrolledCourses = useMemo(() => {
        if (!selectedStudent) {
            return [];
        }

        return enrolledCourses.filter((ec) => ec.studentId === selectedStudent);
    }, [selectedStudent, enrolledCourses]);

    // Loading state
    const isLoading = loadingStudents || loadingEnrollments || loadingCourses;
    const error = studentsError || enrollmentsError || coursesError;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                <p className="text-muted-foreground">Loading courses data...</p>
            </div>
        );
    }

    // Check if there's an error
    if (error && !useMockData) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Courses</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your course enrollments
                    </p>
                </div>

                <div className="bg-background rounded-lg border p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Error Loading Courses</h2>
                    <p className="text-muted-foreground mb-4">
                        {error instanceof Error ? error.message : 'Failed to load course data.'}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={refreshData}
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

                        <Button variant="outline" onClick={() => setUseMockData(true)}>
                            Use Demo Data
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Courses</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage your course enrollments
                </p>
            </div>

            {useMockData && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                            Demo Mode
                        </h3>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            You're viewing demo data. When the API is ready, real course data will
                            be displayed here.
                        </p>
                    </div>
                </div>
            )}

            {students.length > 0 && (
                <div className="bg-background rounded-lg border p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <label className="text-sm font-medium">Select Student:</label>
                        <select
                            value={selectedStudent || ''}
                            onChange={(e) => handleStudentChange(Number(e.target.value))}
                            className="w-full sm:w-auto min-w-[200px] h-10 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp_red focus:ring-offset-2"
                        >
                            <option value="">Select a student</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name} - {student.current_class}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="available">Available Courses</TabsTrigger>
                    <TabsTrigger value="enrolled" disabled={!selectedStudent}>
                        Enrolled Courses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="mt-6 space-y-6">
                    {availableCourses.length === 0 ? (
                        <div className="bg-background rounded-lg border p-8 text-center">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No Available Courses</h2>
                            <p className="text-muted-foreground mb-4">
                                {selectedStudent
                                    ? 'This student is already enrolled in all available courses.'
                                    : 'There are no courses available yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {availableCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-background rounded-lg border overflow-hidden flex flex-col"
                                >
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-2">
                                            {course.name}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4">
                                            {course.description || 'No description available.'}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span>Admission Fee</span>
                                                <span className="font-medium">
                                                    ৳{course.admission_fee}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Monthly Fee</span>
                                                <span className="font-medium">
                                                    ৳{course.tuition_fee || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Available Batches</span>
                                                <span className="font-medium">
                                                    {
                                                        course.batches.filter((b) => b.is_visible)
                                                            .length
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Batches:</h4>
                                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                                {course.batches
                                                    .filter((batch) => batch.is_visible)
                                                    .map((batch) => (
                                                        <div
                                                            key={batch.id}
                                                            className="flex items-center text-xs bg-muted/50 p-1.5 rounded"
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
                                    </div>

                                    <div className="mt-auto p-4 bg-muted/30 border-t">
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/enroll?course=${course.id}${
                                                        selectedStudent
                                                            ? `&student=${selectedStudent}`
                                                            : ''
                                                    }`
                                                )
                                            }
                                            className="w-full bg-tp_red hover:bg-red-600 text-white"
                                            disabled={!students.length}
                                        >
                                            {students.length ? 'Enroll Now' : 'Add Student First'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="enrolled" className="mt-6 space-y-6">
                    {!selectedStudent ? (
                        <div className="bg-background rounded-lg border p-8 text-center">
                            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No Student Selected</h2>
                            <p className="text-muted-foreground mb-4">
                                Please select a student to view their enrolled courses.
                            </p>
                        </div>
                    ) : studentEnrolledCourses.length === 0 ? (
                        <div className="bg-background rounded-lg border p-8 text-center">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No Enrolled Courses</h2>
                            <p className="text-muted-foreground mb-4">
                                This student is not enrolled in any courses yet.
                            </p>
                            <Button
                                onClick={() => setActiveTab('available')}
                                className="bg-tp_red hover:bg-red-600 text-white"
                            >
                                Browse Available Courses
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {studentEnrolledCourses.map((enrollment) => (
                                <div
                                    key={enrollment.enrollmentId}
                                    className="bg-background rounded-lg border overflow-hidden flex flex-col"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold">
                                                {enrollment.courseName}
                                            </h3>
                                            {enrollment.isActive ? (
                                                <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm">
                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-medium">
                                                            {enrollment.batchName}
                                                        </span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {enrollment.batchTiming}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-medium">Started</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                enrollment.startDate
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto p-4 bg-muted/30 border-t">
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/payments?student=${enrollment.studentId}`
                                                )
                                            }
                                            className="w-full"
                                            variant="outline"
                                        >
                                            Payment History
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
