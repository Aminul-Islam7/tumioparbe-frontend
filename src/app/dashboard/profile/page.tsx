'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    ArrowLeft,
    Home,
    Phone,
    Mail,
    Facebook,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form validation schemas
const ParentProfileSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
    address: Yup.string().required('Address is required'),
    facebook_profile: Yup.string()
        .matches(
            /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9(.?)?]/,
            'Please enter a valid Facebook URL'
        )
        .required('Facebook profile is required'),
    email: Yup.string().email('Invalid email address'),
});

const StudentSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    date_of_birth: Yup.date().required('Date of birth is required'),
    father_name: Yup.string().required("Father's name is required"),
    mother_name: Yup.string().required("Mother's name is required"),
    current_class: Yup.string(),
    school: Yup.string(),
});

export default function ProfilePage() {
    const { user, updateUser } = useAuth(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSuccess, showError } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [savingParent, setSavingParent] = useState(false);
    const [savingStudent, setSavingStudent] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [hasLoadedData, setHasLoadedData] = useState(false); // New flag to track if data was loaded

    // Check if we should scroll to add student section
    useEffect(() => {
        const hash = window.location.hash;
        if (hash === '#add-student') {
            setIsAddingStudent(true);
            setTimeout(() => {
                const element = document.getElementById('add-student-section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    // Fetch students data - Fixed to avoid infinite loop
    useEffect(() => {
        // Only fetch if we haven't already loaded the data
        if (user && !hasLoadedData) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    setApiError(null);

                    console.log('Fetching students data...');
                    const response = await userApi.getStudents();
                    console.log('Student API Response:', response.data);

                    // Handle both array and paginated response formats
                    let fetchedStudents: Student[] = [];
                    if (Array.isArray(response.data)) {
                        // Direct array response
                        fetchedStudents = response.data;
                    } else if (response.data && response.data.results) {
                        // Paginated response
                        fetchedStudents = response.data.results;
                    } else {
                        console.error('Unexpected student data format:', response.data);
                        setApiError('Unexpected data format received from server');
                    }

                    setStudents(fetchedStudents);
                    setHasLoadedData(true); // Mark that we've loaded the data

                    // If student ID is in URL, select that student
                    const studentId = searchParams.get('student');
                    if (studentId) {
                        setSelectedStudentId(parseInt(studentId));
                    }
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
    }, [user, searchParams, showError, hasLoadedData]); // Added hasLoadedData as dependency

    // Handle parent profile update
    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingParent(true);
            const response = await userApi.updateProfile(values);
            if (response.data) {
                updateUser(response.data);
                showSuccess('Success', 'Your profile has been updated.');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showError('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSavingParent(false);
        }
    };

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
        return <div className="p-8 text-center">Loading profile data...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile and student information
                </p>
            </div>

            <Tabs defaultValue="parent">
                <TabsList>
                    <TabsTrigger value="parent">Parent Profile</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>

                {/* Parent Profile Tab */}
                <TabsContent value="parent" className="space-y-6 mt-6">
                    <div className="bg-background rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Parent Information</h2>

                        <Formik
                            initialValues={{
                                name: user.name || '',
                                phone: user.phone || '',
                                address: user.address || '',
                                facebook_profile: user.facebook_profile || '',
                                email: user.email || '',
                            }}
                            validationSchema={ParentProfileSchema}
                            onSubmit={handleUpdateProfile}
                            enableReinitialize
                        >
                            {({ isValid, dirty }) => (
                                <Form className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" /> Full Name
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

                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Phone className="h-4 w-4" /> Phone Number
                                            </label>
                                            <Field
                                                name="phone"
                                                type="text"
                                                disabled={true} // Phone number can't be changed
                                                className="flex h-10 w-full rounded-md border bg-muted px-3 py-2 text-sm cursor-not-allowed"
                                            />
                                            <ErrorMessage
                                                name="phone"
                                                component="div"
                                                className="text-red-500 text-xs"
                                            />
                                        </div>

                                        {/* Facebook Profile */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Facebook className="h-4 w-4" /> Facebook Profile
                                            </label>
                                            <Field
                                                name="facebook_profile"
                                                type="text"
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                            />
                                            <ErrorMessage
                                                name="facebook_profile"
                                                component="div"
                                                className="text-red-500 text-xs"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Mail className="h-4 w-4" /> Email (Optional)
                                            </label>
                                            <Field
                                                name="email"
                                                type="email"
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                            />
                                            <ErrorMessage
                                                name="email"
                                                component="div"
                                                className="text-red-500 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Home className="h-4 w-4" /> Address
                                        </label>
                                        <Field
                                            name="address"
                                            as="textarea"
                                            rows={3}
                                            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                        />
                                        <ErrorMessage
                                            name="address"
                                            component="div"
                                            className="text-red-500 text-xs"
                                        />
                                    </div>

                                    {/* Submit button */}
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            className="bg-tp_red hover:bg-red-600"
                                            disabled={savingParent || !dirty || !isValid}
                                        >
                                            {savingParent ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>Save Changes</>
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>

                    {/* Password change section could be added here */}
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-6 mt-6">
                    {/* Student List */}
                    <div className="bg-background rounded-lg border p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Your Students</h2>
                            <Button
                                onClick={() => {
                                    setIsAddingStudent(true);
                                    setSelectedStudentId(null);
                                    setTimeout(() => {
                                        const element =
                                            document.getElementById('add-student-section');
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="bg-tp_red hover:bg-red-600 text-white"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Student
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">Loading students...</p>
                            </div>
                        ) : apiError ? (
                            <div className="text-center py-8 border border-dashed rounded-md">
                                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                                <h3 className="text-lg font-medium mb-2">Error Loading Students</h3>
                                <p className="text-muted-foreground mb-4">{apiError}</p>
                                <Button
                                    className="bg-tp_red hover:bg-red-600"
                                    onClick={() => {
                                        setLoading(true);
                                        setApiError(null);
                                        // Retry fetching students
                                        userApi
                                            .getStudents()
                                            .then((response) => {
                                                console.log(
                                                    'Student API Response (retry):',
                                                    response.data
                                                );

                                                // Handle both array and paginated response formats
                                                let fetchedStudents: Student[] = [];
                                                if (Array.isArray(response.data)) {
                                                    // Direct array response
                                                    fetchedStudents = response.data;
                                                } else if (response.data && response.data.results) {
                                                    // Paginated response
                                                    fetchedStudents = response.data.results;
                                                }

                                                setStudents(fetchedStudents);
                                            })
                                            .catch((error) => {
                                                console.error(
                                                    'Failed to fetch student data:',
                                                    error
                                                );
                                                setApiError('Unable to connect to the server');
                                                showError(
                                                    'Error',
                                                    'Failed to load student data. Please try again.'
                                                );
                                            })
                                            .finally(() => setLoading(false));
                                    }}
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-md">
                                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <h3 className="text-lg font-medium mb-2">No Students Added Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Add your first student to start enrolling in courses.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {students.map((student) => (
                                    <div key={student.id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium">{student.name}</h3>
                                                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                                    <p>
                                                        Date of Birth:{' '}
                                                        {new Date(
                                                            student.date_of_birth
                                                        ).toLocaleDateString()}
                                                    </p>
                                                    <p>
                                                        School: {student.school || 'Not specified'}
                                                    </p>
                                                    <p>
                                                        Class:{' '}
                                                        {student.current_class || 'Not specified'}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedStudentId(student.id);
                                                    setIsAddingStudent(true);
                                                    setTimeout(() => {
                                                        const element =
                                                            document.getElementById(
                                                                'add-student-section'
                                                            );
                                                        if (element)
                                                            element.scrollIntoView({
                                                                behavior: 'smooth',
                                                            });
                                                    }, 100);
                                                }}
                                            >
                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Student Form */}
                    {isAddingStudent && (
                        <div
                            id="add-student-section"
                            className="bg-background rounded-lg border p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">
                                    {selectedStudentId ? 'Edit Student' : 'Add New Student'}
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsAddingStudent(false);
                                        setSelectedStudentId(null);
                                    }}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                            </div>

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
                                {({ isValid, dirty }) => (
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

                                        <div className="flex justify-end">
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
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
