'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
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
    const { showSuccess, showError } = useToast();

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
                    console.error('Failed to fetch student data:', error);
                    setApiError('Unable to connect to the server');
                    showError('Error', 'Failed to load student data. Please try again.');
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
                    showSuccess('Success', 'Student information updated.');
                    setSelectedStudentId(null);
                    setIsAddingStudent(false);
                }
            } else {
                // Add new student
                const response = await userApi.addStudent(values);
                if (response.data) {
                    setStudents((prev) => [...prev, response.data]);
                    showSuccess('Success', 'New student added successfully.');
                    resetForm();
                    setIsAddingStudent(false);
                }
            }
        } catch (error) {
            console.error('Failed to save student:', error);
            showError('Error', 'Failed to save student information. Please try again.');
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
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header removed as it is now in layout */}

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                    <p className="text-muted-foreground">Loading students...</p>
                </div>
            ) : apiError ? (
                <div className="bg-background rounded-lg border p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Error Loading Students</h2>
                    <p className="text-muted-foreground mb-4">{apiError}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-tp_red hover:bg-red-600 text-white"
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <>
                    {/* Student Cards Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Existing Students */}
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="bg-background rounded-lg border overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 bg-bubblegum/10 rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-bubblegum" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    {student.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Student
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                Born:{' '}
                                                {new Date(student.date_of_birth).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {student.school && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <School className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    School:{' '}
                                                    {student.school}
                                                </span>
                                            </div>
                                        )}

                                        {student.current_class && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    Class:{' '}
                                                    {student.current_class}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2 text-sm pt-2 border-t">
                                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Father:</span>{' '}
                                                    {student.father_name}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Mother:</span>{' '}
                                                    {student.mother_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto p-4 space-y-2">
                                    <Button
                                        onClick={() => {
                                            setSelectedStudentId(student.id);
                                            setIsAddingStudent(true);
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Information
                                    </Button>
                                    <Link href="/dashboard/courses" className="block">
                                        <Button
                                            variant="default"
                                            className="w-full bg-tp_red hover:bg-red-600 text-white"
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
                            className="bg-background rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col hover:border-tp_red hover:bg-tp_red/5 transition-all cursor-pointer min-h-[300px]"
                        >
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-tp_red/10 rounded-full flex items-center justify-center mb-4">
                                    <UserPlus className="h-8 w-8 text-tp_red" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Add New Student</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click here to add a new child
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add/Edit Student Modal/Form */}
                    {isAddingStudent && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-background rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-background border-b p-6 flex justify-between items-center">
                                    <h2 className="text-xl font-semibold">
                                        {selectedStudentId ? 'Edit Student' : 'Add New Student'}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
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
                                            father_name: getSelectedStudent()?.father_name || '',
                                            mother_name: getSelectedStudent()?.mother_name || '',
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
                                                        <label className="text-sm font-medium">
                                                            Student Name *
                                                        </label>
                                                        <Field
                                                            name="name"
                                                            type="text"
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="name"
                                                            component="div"
                                                            className="text-red-500 text-xs"
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
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
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
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="father_name"
                                                            component="div"
                                                            className="text-red-500 text-xs"
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
                                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                                        />
                                                        <ErrorMessage
                                                            name="current_class"
                                                            component="div"
                                                            className="text-red-500 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsAddingStudent(false);
                                                            setSelectedStudentId(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="bg-tp_red hover:bg-red-600"
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
