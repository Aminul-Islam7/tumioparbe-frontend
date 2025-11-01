'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { userApi, enrollmentApi, paymentApi } from '@/lib/api';
import { Student, Enrollment, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { CreditCard, PlusCircle, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalDue: number;
        activeEnrollments: number;
        totalStudents: number;
    }>({
        totalDue: 0,
        activeEnrollments: 0,
        totalStudents: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch students
                const studentsResponse = await userApi.getStudents();
                const fetchedStudents = studentsResponse.data.results || [];
                setStudents(fetchedStudents);

                // Fetch enrollments
                const enrollmentsResponse = await enrollmentApi.getEnrollments({
                    is_active: true,
                });
                const fetchedEnrollments = enrollmentsResponse.data.results || [];
                setEnrollments(fetchedEnrollments);

                // Fetch pending invoices
                const invoicesResponse = await paymentApi.getPendingInvoices();
                const fetchedInvoices = invoicesResponse.data.results || [];
                setPendingInvoices(fetchedInvoices);

                // Calculate stats
                const totalDue = fetchedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

                setStats({
                    totalDue,
                    activeEnrollments: fetchedEnrollments.length,
                    totalStudents: fetchedStudents.length,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    // Simple fallback when loading
    if (!user) {
        return <div className="py-10 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Back'}!</h1>
                <p className="text-muted-foreground mt-2">
                    This is your dashboard where you can manage your children's courses and
                    payments.
                </p>
            </div>

            {/* Dashboard stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">Total Due</h3>
                    <p className="text-3xl font-bold">
                        {loading ? '...' : `৳${stats.totalDue.toLocaleString()}`}
                    </p>
                    {stats.totalDue > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            className="mt-4 bg-tp_red hover:bg-red-600"
                            asChild
                        >
                            <Link href="/dashboard/payments">
                                Pay Now <CreditCard className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">Active Enrollments</h3>
                    <p className="text-3xl font-bold">
                        {loading ? '...' : stats.activeEnrollments}
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link href="/dashboard/courses">
                            View Courses <BookOpen className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="p-6 bg-background rounded-lg shadow-sm border">
                    <h3 className="font-semibold mb-2">Students</h3>
                    <p className="text-3xl font-bold">{loading ? '...' : stats.totalStudents}</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link href="/dashboard/profile">
                            Manage <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Students Section */}
            <div className="bg-background rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Your Students</h2>
                    <Button asChild className="bg-tp_red hover:bg-red-600">
                        <Link href="/dashboard/profile#add-student">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <p className="text-muted-foreground">Loading students...</p>
                ) : students.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="font-medium text-lg mb-2">No Students Added Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your child's information to enroll in courses.
                        </p>
                        <Button asChild className="bg-tp_red hover:bg-red-600">
                            <Link href="/dashboard/profile#add-student">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Student
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {students.map((student) => (
                            <div key={student.id} className="border rounded-lg p-4">
                                <h3 className="font-semibold text-lg">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {student.current_class
                                        ? `Class: ${student.current_class}`
                                        : 'No class specified'}
                                </p>

                                {/* Count enrollments for this student */}
                                {(() => {
                                    const studentEnrollments = enrollments.filter(
                                        (e) => e.student === student.id
                                    );
                                    return (
                                        <div className="mt-2">
                                            <p className="text-sm">
                                                <span className="font-medium">
                                                    {studentEnrollments.length}{' '}
                                                    {studentEnrollments.length === 1
                                                        ? 'Course'
                                                        : 'Courses'}
                                                </span>{' '}
                                                enrolled
                                            </p>

                                            {studentEnrollments.length > 0 ? (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="pl-0 text-tp_red"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/dashboard/courses?student=${student.id}`}
                                                    >
                                                        View Courses{' '}
                                                        <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="pl-0 text-tp_red"
                                                    asChild
                                                >
                                                    <Link href="/dashboard/courses">
                                                        Browse Courses{' '}
                                                        <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Payments Section */}
            {pendingInvoices.length > 0 && (
                <div className="bg-background rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Pending Payments</h2>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/payments">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-2">Student</th>
                                    <th className="text-left p-2">Month</th>
                                    <th className="text-left p-2">Course</th>
                                    <th className="text-right p-2">Amount</th>
                                    <th className="text-right p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingInvoices.slice(0, 5).map((invoice) => (
                                    <tr key={invoice.id} className="border-b">
                                        <td className="p-2">
                                            {students.find((s) => {
                                                const enrollment = enrollments.find(
                                                    (e) => e.id === invoice.enrollment
                                                );
                                                return enrollment && s.id === enrollment.student;
                                            })?.name || 'Unknown'}
                                        </td>
                                        <td className="p-2">
                                            {new Date(invoice.month).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                            })}
                                        </td>
                                        <td className="p-2">
                                            {/* This would require additional API calls to get course name */}
                                            Course #
                                            {enrollments.find((e) => e.id === invoice.enrollment)
                                                ?.batch || 'Unknown'}
                                        </td>
                                        <td className="p-2 text-right">৳{invoice.amount}</td>
                                        <td className="p-2 text-right">
                                            <Button
                                                size="sm"
                                                className="bg-tp_red hover:bg-red-600"
                                                onClick={() => {
                                                    // This would be implemented in the payments page
                                                    window.location.href = `/dashboard/payments?pay=${invoice.id}`;
                                                }}
                                            >
                                                Pay Now
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pendingInvoices.length > 5 && (
                        <div className="mt-4 text-center">
                            <Button variant="link" asChild>
                                <Link href="/dashboard/payments">
                                    View All {pendingInvoices.length} Pending Payments
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
