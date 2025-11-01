'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { paymentApi, userApi, enrollmentApi, courseApi } from '@/lib/api';
import { Invoice, Payment, Student, Enrollment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Download,
    Calendar,
    User,
    BookOpen,
    CreditCard,
    Loader2,
    Search,
    Filter,
    ArrowUpDown,
} from 'lucide-react';

export default function PaymentsPage() {
    const { user } = useAuth(true);
    const searchParams = useSearchParams();
    const { showSuccess, showError } = useToast();

    const [loading, setLoading] = useState(true);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    // For filtering and sorting
    const [studentFilter, setStudentFilter] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [activeTab, setActiveTab] = useState('pending');

    // Enriched invoice data with student and course names
    const [enrichedInvoices, setEnrichedInvoices] = useState<
        {
            invoiceId: number;
            studentId: number;
            studentName: string;
            courseName: string;
            batchName: string;
            month: string;
            amount: number;
            isPaid: boolean;
        }[]
    >([]);

    // Enriched payment data
    const [enrichedPayments, setEnrichedPayments] = useState<
        {
            paymentId: number;
            invoiceId: number;
            studentName: string;
            courseName: string;
            month: string;
            amount: number;
            transactionId: string;
            paymentMethod: string;
            paymentDate: string;
        }[]
    >([]);

    // Check if there's a specific invoice to pay (from URL param)
    useEffect(() => {
        const invoiceIdToPayParam = searchParams.get('pay');
        if (invoiceIdToPayParam) {
            const invoiceId = parseInt(invoiceIdToPayParam);
            setSelectedInvoices([invoiceId]);
        }
    }, [searchParams]);

    // Memoize the process enriched data function to prevent recreating it on each render
    const processEnrichedData = useCallback(
        async (
            students: Student[],
            enrollments: Enrollment[],
            invoices: Invoice[],
            payments: Payment[]
        ) => {
            try {
                // Process invoice data
                const enrichedInvoicesData = [];

                // Create a map to cache batch and course data
                const batchDataMap = new Map();
                let coursesData: Course[] = [];

                // Fetch courses just once
                const coursesResponse = await courseApi.getCourses();
                coursesData = coursesResponse.data.results || [];

                for (const invoice of invoices) {
                    const enrollment = enrollments.find((e) => e.id === invoice.enrollment);

                    if (enrollment) {
                        const student = students.find((s) => s.id === enrollment.student);

                        if (student) {
                            // Get batch info (use cached version if available)
                            let batch;
                            if (batchDataMap.has(enrollment.batch)) {
                                batch = batchDataMap.get(enrollment.batch);
                            } else {
                                const batchResponse = await courseApi.getBatch(enrollment.batch);
                                batch = batchResponse.data;
                                batchDataMap.set(enrollment.batch, batch);
                            }

                            // Find course that contains this batch
                            const course = coursesData.find((c) =>
                                c.batches.some((b) => b.id === batch.id)
                            );

                            if (course && batch) {
                                enrichedInvoicesData.push({
                                    invoiceId: invoice.id,
                                    studentId: student.id,
                                    studentName: student.name,
                                    courseName: course.name,
                                    batchName: batch.name,
                                    month: invoice.month,
                                    amount: invoice.amount,
                                    isPaid: invoice.is_paid,
                                });
                            }
                        }
                    }
                }

                setEnrichedInvoices(enrichedInvoicesData);

                // Process payment history data
                const enrichedPaymentsData = [];

                for (const payment of payments) {
                    // Find corresponding invoice
                    const invoice = invoices.find((i) => i.id === payment.invoice);

                    if (invoice) {
                        const enrollment = enrollments.find((e) => e.id === invoice.enrollment);

                        if (enrollment) {
                            const student = students.find((s) => s.id === enrollment.student);

                            if (student) {
                                // Get batch info (use cached version if available)
                                let batch;
                                if (batchDataMap.has(enrollment.batch)) {
                                    batch = batchDataMap.get(enrollment.batch);
                                } else {
                                    const batchResponse = await courseApi.getBatch(
                                        enrollment.batch
                                    );
                                    batch = batchResponse.data;
                                    batchDataMap.set(enrollment.batch, batch);
                                }

                                // Find course that contains this batch
                                const course = coursesData.find((c) =>
                                    c.batches.some((b) => b.id === batch.id)
                                );

                                if (course) {
                                    enrichedPaymentsData.push({
                                        paymentId: payment.id,
                                        invoiceId: invoice.id,
                                        studentName: student.name,
                                        courseName: course.name,
                                        month: invoice.month,
                                        amount: payment.amount,
                                        transactionId: payment.transaction_id,
                                        paymentMethod: payment.payment_method,
                                        paymentDate: payment.payment_execute_time,
                                    });
                                }
                            }
                        }
                    }
                }

                setEnrichedPayments(enrichedPaymentsData);
            } catch (error) {
                console.error('Error processing enriched data:', error);
                showError('Error', 'Failed to process payment data.');
            }
        },
        [showError]
    );

    // Memoize the fetch data function to prevent recreating it on each render
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch students
            const studentsResponse = await userApi.getStudents();
            const fetchedStudents = studentsResponse.data.results || [];
            setStudents(fetchedStudents);

            // Fetch enrollments
            const enrollmentsResponse = await enrollmentApi.getEnrollments();
            const fetchedEnrollments = enrollmentsResponse.data.results || [];
            setEnrollments(fetchedEnrollments);

            // Fetch pending invoices
            const invoicesResponse = await paymentApi.getPendingInvoices();
            const fetchedInvoices = invoicesResponse.data.results || [];
            setPendingInvoices(fetchedInvoices);

            // Fetch payment history
            const paymentsResponse = await paymentApi.getPaymentHistory();
            const fetchedPayments = paymentsResponse.data.results || [];
            setPaymentHistory(fetchedPayments);

            // Process enriched data
            await processEnrichedData(
                fetchedStudents,
                fetchedEnrollments,
                fetchedInvoices,
                fetchedPayments
            );
        } catch (error) {
            console.error('Failed to fetch payment data:', error);
            showError('Error', 'Failed to load payment data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [processEnrichedData, showError]);

    // Fetch all data once on component mount
    useEffect(() => {
        fetchData();
        // fetchData is now a dependency but it's memoized with useCallback
        // so it won't change between renders unless its dependencies change
    }, [fetchData]);

    // Handle single invoice payment
    const handlePayInvoice = async (invoiceId: number) => {
        try {
            setProcessingPayment(true);

            const response = await paymentApi.payInvoice(invoiceId);

            // Redirect to bKash payment URL or handle as needed
            if (response.data) {
                // This should be replaced with actual code to handle the payment gateway
                showSuccess('Payment Initiated', 'You will be redirected to the payment gateway.');
            }
        } catch (error) {
            console.error('Failed to initiate payment:', error);
            showError('Error', 'Failed to initiate payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Handle bulk payment
    const handleBulkPayment = async () => {
        if (selectedInvoices.length === 0) {
            showError('Error', 'Please select at least one invoice to pay.');
            return;
        }

        try {
            setProcessingPayment(true);

            const response = await paymentApi.bulkPayInvoices(selectedInvoices);

            // Redirect to bKash payment URL or handle as needed
            if (response.data) {
                // This should be replaced with actual code to handle the payment gateway
                showSuccess('Payment Initiated', 'You will be redirected to the payment gateway.');
            }
        } catch (error) {
            console.error('Failed to initiate bulk payment:', error);
            showError('Error', 'Failed to initiate bulk payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Toggle invoice selection
    const toggleInvoiceSelection = (invoiceId: number) => {
        setSelectedInvoices((prevSelected) => {
            if (prevSelected.includes(invoiceId)) {
                return prevSelected.filter((id) => id !== invoiceId);
            } else {
                return [...prevSelected, invoiceId];
            }
        });
    };

    // Select all invoices
    const selectAllInvoices = () => {
        if (selectedInvoices.length === enrichedInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(enrichedInvoices.map((invoice) => invoice.invoiceId));
        }
    };

    // Calculate total due
    const calculateTotalDue = () => {
        if (selectedInvoices.length === 0) {
            return enrichedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
        }

        return enrichedInvoices
            .filter((invoice) => selectedInvoices.includes(invoice.invoiceId))
            .reduce((sum, invoice) => sum + invoice.amount, 0);
    };

    // Filter and sort invoices
    const getFilteredInvoices = () => {
        return enrichedInvoices
            .filter((invoice) => {
                // Apply student filter
                if (studentFilter && invoice.studentId !== studentFilter) {
                    return false;
                }

                // Apply search filter
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    return (
                        invoice.studentName.toLowerCase().includes(term) ||
                        invoice.courseName.toLowerCase().includes(term) ||
                        invoice.month.includes(term)
                    );
                }

                return true;
            })
            .sort((a, b) => {
                // Sort by date
                const dateA = new Date(a.month);
                const dateB = new Date(b.month);

                return sortOrder === 'asc'
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
    };

    // Filter and sort payment history
    const getFilteredPayments = () => {
        return enrichedPayments
            .filter((payment) => {
                // Apply student filter
                if (studentFilter) {
                    const invoiceIds = enrichedInvoices
                        .filter((invoice) => invoice.studentId === studentFilter)
                        .map((invoice) => invoice.invoiceId);

                    if (!invoiceIds.includes(payment.invoiceId)) {
                        return false;
                    }
                }

                // Apply search filter
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    return (
                        payment.studentName.toLowerCase().includes(term) ||
                        payment.courseName.toLowerCase().includes(term) ||
                        payment.month.includes(term) ||
                        payment.transactionId.toLowerCase().includes(term)
                    );
                }

                return true;
            })
            .sort((a, b) => {
                // Sort by payment date
                const dateA = new Date(a.paymentDate);
                const dateB = new Date(b.paymentDate);

                return sortOrder === 'asc'
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-tp_red mb-4" />
                <p className="text-muted-foreground">Loading payment data...</p>
            </div>
        );
    }

    const filteredInvoices = getFilteredInvoices();
    const filteredPayments = getFilteredPayments();
    const totalDue = calculateTotalDue();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payments</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your monthly payments and view payment history
                </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-background rounded-lg border p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Payment Summary</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {pendingInvoices.length === 0
                                ? 'All payments are up to date!'
                                : `You have ${pendingInvoices.length} pending payment${pendingInvoices.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Due:</div>
                        <div className="text-2xl font-bold">৳{totalDue.toLocaleString()}</div>

                        {selectedInvoices.length > 0 && (
                            <Button
                                className="ml-4 bg-tp_red hover:bg-red-600"
                                onClick={handleBulkPayment}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                )}
                                Pay Selected ({selectedInvoices.length})
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="bg-background rounded-lg border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Student Filter */}
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Filter by Student:</label>
                        <select
                            className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp_red focus:ring-offset-2"
                            value={studentFilter || ''}
                            onChange={(e) =>
                                setStudentFilter(e.target.value ? parseInt(e.target.value) : null)
                            }
                        >
                            <option value="">All Students</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Search:</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name, course..."
                                className="w-full h-10 rounded-md border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tp_red focus:ring-offset-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Sort by Date:</label>
                        <button
                            className="flex items-center gap-2 h-10 px-4 rounded-md border bg-background text-sm hover:bg-muted"
                            onClick={() =>
                                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                            }
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs for Pending and History */}
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending Payments</TabsTrigger>
                    <TabsTrigger value="history">Payment History</TabsTrigger>
                </TabsList>

                {/* Pending Payments Tab */}
                <TabsContent value="pending" className="mt-4">
                    {filteredInvoices.length === 0 ? (
                        <div className="bg-background rounded-lg border p-8 text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                            <h2 className="text-xl font-medium mb-2">All Payments Up to Date!</h2>
                            <p className="text-muted-foreground mb-4">
                                You don't have any pending payments at the moment.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-background rounded-lg border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-tp_red focus:ring-tp_red h-4 w-4"
                                                        checked={
                                                            selectedInvoices.length ===
                                                                filteredInvoices.length &&
                                                            filteredInvoices.length > 0
                                                        }
                                                        onChange={selectAllInvoices}
                                                    />
                                                </div>
                                            </th>
                                            <th className="p-3 text-left">Student</th>
                                            <th className="p-3 text-left">Month</th>
                                            <th className="p-3 text-left">Course</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredInvoices.map((invoice) => (
                                            <tr
                                                key={invoice.invoiceId}
                                                className="hover:bg-muted/50"
                                            >
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-tp_red focus:ring-tp_red h-4 w-4"
                                                        checked={selectedInvoices.includes(
                                                            invoice.invoiceId
                                                        )}
                                                        onChange={() =>
                                                            toggleInvoiceSelection(
                                                                invoice.invoiceId
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-3">{invoice.studentName}</td>
                                                <td className="p-3">
                                                    {new Date(invoice.month).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                        }
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {invoice.courseName}
                                                    <div className="text-xs text-muted-foreground">
                                                        Batch: {invoice.batchName}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    ৳{invoice.amount.toLocaleString()}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex items-center gap-1"
                                                            onClick={() => {
                                                                // View invoice details
                                                            }}
                                                        >
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">
                                                                View
                                                            </span>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            className="bg-tp_red hover:bg-red-600 flex items-center gap-1"
                                                            onClick={() =>
                                                                handlePayInvoice(invoice.invoiceId)
                                                            }
                                                            disabled={processingPayment}
                                                        >
                                                            {processingPayment ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <CreditCard className="h-3.5 w-3.5" />
                                                            )}
                                                            <span className="hidden sm:inline">
                                                                Pay Now
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selectedInvoices.length > 0 && (
                                <div className="bg-muted/50 p-3 flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            {selectedInvoices.length}
                                        </span>{' '}
                                        invoices selected (
                                        {filteredInvoices
                                            .filter((invoice) =>
                                                selectedInvoices.includes(invoice.invoiceId)
                                            )
                                            .reduce((sum, invoice) => sum + invoice.amount, 0)
                                            .toLocaleString()}{' '}
                                        ৳)
                                    </div>
                                    <Button
                                        className="bg-tp_red hover:bg-red-600"
                                        onClick={handleBulkPayment}
                                        disabled={processingPayment}
                                    >
                                        {processingPayment ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="mr-2 h-4 w-4" />
                                        )}
                                        Pay Selected
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Payment History Tab */}
                <TabsContent value="history" className="mt-4">
                    {filteredPayments.length === 0 ? (
                        <div className="bg-background rounded-lg border p-8 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <h2 className="text-xl font-medium mb-2">No Payment History</h2>
                            <p className="text-muted-foreground mb-4">
                                You haven't made any payments yet.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-background rounded-lg border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left">Student</th>
                                            <th className="p-3 text-left">Month</th>
                                            <th className="p-3 text-left">Course</th>
                                            <th className="p-3 text-left">Payment Date</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-left">Transaction ID</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredPayments.map((payment) => (
                                            <tr
                                                key={payment.paymentId}
                                                className="hover:bg-muted/50"
                                            >
                                                <td className="p-3">{payment.studentName}</td>
                                                <td className="p-3">
                                                    {new Date(payment.month).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                        }
                                                    )}
                                                </td>
                                                <td className="p-3">{payment.courseName}</td>
                                                <td className="p-3">
                                                    {new Date(
                                                        payment.paymentDate
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-right">
                                                    ৳{payment.amount.toLocaleString()}
                                                </td>
                                                <td className="p-3 font-mono text-xs">
                                                    {payment.transactionId}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex items-center gap-1"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">
                                                                Receipt
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
