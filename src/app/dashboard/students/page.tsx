'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import {
    User,
    UserPlus,
    Edit,
    X,
    Loader2,
    AlertTriangle,
    Calendar,
    School,
    GraduationCap,
    Users,
    BookOpen,
} from 'lucide-react';

// Form validation schema
const StudentSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    date_of_birth: Yup.date().required('Date of birth is required'),
    father_name: Yup.string().required("Father's name is required"),
    mother_name: Yup.string().required("Mother's name is required"),
    current_class: Yup.string(),
    school: Yup.string(),
});

export default function StudentsPage() {
    const { user } = useAuth(true);


    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [savingStudent, setSavingStudent] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Fetch students data
    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    setApiError(null);

                    const response = await userApi.getStudents();

                    // Handle both array and paginated response formats
                    let fetchedStudents: Student[] = [];
                    if (Array.isArray(response.data)) {
                        fetchedStudents = response.data;
                    } else if (response.data && response.data.results) {
                        fetchedStudents = response.data.results;
                    }

                    setStudents(fetchedStudents);
                } catch (error) {
                    setApiError('Unable to connect to the server');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Handle student add/update
    const handleSaveStudent = async (values: any, { resetForm }: { resetForm: () => void }) => {
        try {
            setSavingStudent(true);

            if (selectedStudentId) {
                // Update existing student
                const response = await userApi.updateStudent(selectedStudentId, values);
                if (response.data) {
                    setStudents((prev) =>
                        prev.map((student) =>
                            student.id === selectedStudentId ? response.data : student
                        )
                    );

                    setSelectedStudentId(null);
                    setIsAddingStudent(false);
                }
            } else {
                // Add new student
                const response = await userApi.addStudent(values);
                if (response.data) {
                    setStudents((prev) => [...prev, response.data]);

                    resetForm();
                    setIsAddingStudent(false);
                }
            }
        } catch (error) {
            console.error('Failed to save student information:', error);
        } finally {
            setSavingStudent(false);
        }
    };

    // Get the selected student data
    const getSelectedStudent = () => {
        if (!selectedStudentId) return null;
        return students.find((s) => s.id === selectedStudentId) || null;
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-lavender-100 dark:bg-lavender-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-lavender-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header removed as it is now in layout */}

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-lavender-100 dark:bg-lavender-900/30 animate-pulse" />
                        <Loader2 className="h-8 w-8 animate-spin text-lavender-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-body-muted mt-4">Loading students...</p>
                </div>
            ) : apiError ? (
                <div className="bg-card rounded-card border-2 border-amber-200 dark:border-amber-800 p-8 text-center shadow-card">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-heading mb-2">Error Loading Students</h2>
                    <p className="text-body-muted mb-6">{apiError}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="warning"
                        size="lg"
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <>
                    {/* Student Cards Grid */}
                    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                        {/* Existing Students */}
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="bg-card-assignments-bg border-2 border-card-assignments-border rounded-card overflow-hidden flex flex-col hover:shadow-lavender transition-all duration-normal group"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-14 w-14 bg-lavender-50 dark:bg-lavender-800/40 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <User className="h-7 w-7 text-lavender-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-heading">
                                                    {student.name}
                                                </h3>
                                                <p className="text-xs text-body-muted">
                                                    Student
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm p-2.5 rounded-xl bg-white/60 dark:bg-lavender-800/40">
                                            <Calendar className="h-4 w-4 text-lavender-500" />
                                            <span className="text-body">
                                                Born:{' '}
                                                {new Date(student.date_of_birth).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {student.school && (
                                            <div className="flex items-center gap-3 text-sm p-2.5 rounded-xl bg-white/60 dark:bg-lavender-800/40">
                                                <School className="h-4 w-4 text-lavender-500" />
                                                <span className="text-body">
                                                    {student.school}
                                                </span>
                                            </div>
                                        )}

                                        {student.current_class && (
                                            <div className="flex items-center gap-3 text-sm p-2.5 rounded-xl bg-white/60 dark:bg-lavender-800/40">
                                                <GraduationCap className="h-4 w-4 text-lavender-500" />
                                                <span className="text-body">
                                                    Class: {student.current_class}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3 text-sm p-2.5 rounded-xl bg-white/60 dark:bg-lavender-800/40">
                                            <Users className="h-4 w-4 text-lavender-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-body">
                                                    <span className="font-medium">Father:</span>{' '}
                                                    {student.father_name}
                                                </p>
                                                <p className="text-body">
                                                    <span className="font-medium">Mother:</span>{' '}
                                                    {student.mother_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto p-5 space-y-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
                                    <Button
                                        onClick={() => {
                                            setSelectedStudentId(student.id);
                                            setIsAddingStudent(true);
                                        }}
                                        variant="outline"
                                        className="w-full border-lavender-300 dark:border-lavender-700 text-lavender-600 dark:text-lavender-400 hover:bg-lavender-50 dark:hover:bg-lavender-900/20"
                                        size="lg"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Information
                                    </Button>
                                    <Link href={`/dashboard/courses?studentId=${student.id}`} className="block">
                                        <Button
                                            className="w-full"
                                            size="lg"
                                            variant="lavender"
                                        >
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Enroll to a Course
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {/* Add Student Card */}
                        <div
                            onClick={() => {
                                setSelectedStudentId(null);
                                setIsAddingStudent(true);
                            }}
                            className="bg-card rounded-card border-2 border-dashed border-lavender-200 dark:border-lavender-800 overflow-hidden flex flex-col hover:border-lavender hover:bg-lavender-50 dark:hover:bg-lavender-900/20 transition-all duration-normal cursor-pointer min-h-[300px] group"
                        >
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                                <div className="h-20 w-20 bg-lavender-100 dark:bg-lavender-900/50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <UserPlus className="h-10 w-10 text-lavender-500" />
                                </div>
                                <h3 className="text-lg font-bold text-heading mb-2">Add New Student</h3>
                                <p className="text-sm text-body-muted">
                                    Click here to add a new child
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add/Edit Student Modal/Form */}
                    {isAddingStudent && (
                        <div className="fixed inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center z-modal p-4">
                            <div className="bg-card rounded-3xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-card border-b rounded-t-3xl p-6 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-heading">
                                        {selectedStudentId ? 'Edit Student' : 'Add New Student'}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsAddingStudent(false);
                                            setSelectedStudentId(null);
                                        }}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="p-6">
                                    <Formik
                                        initialValues={{
                                            name: getSelectedStudent()?.name || '',
                                            date_of_birth: getSelectedStudent()?.date_of_birth
                                                ? new Date(getSelectedStudent()!.date_of_birth)
                                                      .toISOString()
                                                      .split('T')[0]
                                                : '',
                                            school: getSelectedStudent()?.school || '',
                                            current_class: getSelectedStudent()?.current_class || '',
                                            father_name: getSelectedStudent()?.father_name || (students.length > 0 ? students[0].father_name : ''),
                                            mother_name: getSelectedStudent()?.mother_name || (students.length > 0 ? students[0].mother_name : ''),
                                        }}
                                        validationSchema={StudentSchema}
                                        onSubmit={handleSaveStudent}
                                        enableReinitialize
                                    >
                                        {({ isValid }) => (
                                            <Form className="space-y-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {/* Student Name */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-heading">
                                                            Student Name *
                                                        </label>
                                                        <Field
                                                            name="name"
                                                            type="text"
                                                            className="flex h-11 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="name"
                                                            component="div"
                                                            className="text-error text-xs"
                                                        />
                                                    </div>

                                                    {/* Date of Birth */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">
                                                            Date of Birth *
                                                        </label>
                                                        <Field
                                                            name="date_of_birth"
                                                            type="date"
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="date_of_birth"
                                                            component="div"
                                                            className="text-red-500 text-xs"
                                                        />
                                                    </div>

                                                    {/* Father's Name */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">
                                                            Father's Name *
                                                        </label>
                                                        <Field
                                                            name="father_name"
                                                            type="text"
                                                            className="flex h-11 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="father_name"
                                                            component="div"
                                                            className="text-error text-xs"
                                                        />
                                                    </div>

                                                    {/* Mother's Name */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">
                                                            Mother's Name *
                                                        </label>
                                                        <Field
                                                            name="mother_name"
                                                            type="text"
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="mother_name"
                                                            component="div"
                                                            className="text-red-500 text-xs"
                                                        />
                                                    </div>

                                                    {/* School */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">
                                                            School (Optional)
                                                        </label>
                                                        <Field
                                                            name="school"
                                                            type="text"
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="school"
                                                            component="div"
                                                            className="text-red-500 text-xs"
                                                        />
                                                    </div>

                                                    {/* Class */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">
                                                            Class (Optional)
                                                        </label>
                                                        <Field
                                                            name="current_class"
                                                            type="text"
                                                            className="flex h-11 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="current_class"
                                                            component="div"
                                                            className="text-red-500 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-6">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="lg"
                                                        className="border-lavender-300 dark:border-lavender-700 text-lavender-600 dark:text-lavender-400 hover:bg-lavender-50 dark:hover:bg-lavender-900/20"
                                                        onClick={() => {
                                                            setIsAddingStudent(false);
                                                            setSelectedStudentId(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        size="lg"
                                                        variant="lavender"
                                                        disabled={savingStudent || !isValid}
                                                    >
                                                        {savingStudent ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Saving...
                                                            </>
                                                        ) : selectedStudentId ? (
                                                            'Update Student'
                                                        ) : (
                                                            'Add Student'
                                                        )}
                                                    </Button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
