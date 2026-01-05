'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const paymentID = searchParams.get('paymentID');
    const statusParam = searchParams.get('status');
    
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing your payment...');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    
    // Track if we've already processed
    const hasProcessed = useRef(false);


    useEffect(() => {
        // Handle non-success statuses immediately
        if (statusParam && statusParam.toLowerCase() === 'failure') {
            router.replace('/payment/failure');
            return;
        }
        if (statusParam && statusParam.toLowerCase() === 'cancel') {
            router.replace('/payment/cancel');
            return;
        }

        const MAX_RETRIES = 3;
        const INITIAL_DELAY = 1000; // 1 second

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const executePaymentWithRetry = async (attempt: number = 1): Promise<void> => {
            if (!paymentID) {
                setStatus('error');
                setMessage('No payment ID found. Please try again.');
                return;
            }

            // Prevent double processing
            if (hasProcessed.current) {
                return;
            }

            try {
                // Call the backend to execute and finalize the payment
                const response = await paymentApi.executeBkashPayment(paymentID);
                const data = response.data as any;
                
                // Mark as processed only on success/definitive failure
                hasProcessed.current = true;
                
                if (data?.status === 'success') {
                    setStatus('success');
                    setMessage(data.message || 'Payment completed successfully!');
                    setTransactionId(data.transaction_id);
                } else if (data?.status === 'failed') {
                    // Definitive failure from backend - don't retry
                    setStatus('error');
                    setMessage(data?.message || 'Payment processing failed.');
                } else {
                    setStatus('error');
                    setMessage(data?.message || 'Unexpected response from server.');
                }
            } catch (error: any) {
                console.error(`Payment execution attempt ${attempt} failed:`, error);
                
                // Check if it's a network error (worth retrying)
                const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED';
                
                if (isNetworkError && attempt < MAX_RETRIES) {
                    // Exponential backoff: 1s, 2s, 4s
                    const waitTime = INITIAL_DELAY * Math.pow(2, attempt - 1);
                    setMessage(`Connection issue. Retrying in ${waitTime / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
                    
                    await delay(waitTime);
                    return executePaymentWithRetry(attempt + 1);
                }
                
                // All retries exhausted or it's a server error (not network)
                hasProcessed.current = true;
                setStatus('error');
                
                if (error.response?.status === 400) {
                    // Bad request - likely already processed or invalid
                    setMessage(
                        error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Payment could not be processed. It may have already been completed or expired.'
                    );
                } else {
                    setMessage(
                        'Failed to process payment due to a connection issue. Your payment may still be successful. ' +
                        'Please check your payment history or contact support.'
                    );
                }
            }
        };

        executePaymentWithRetry();
    }, [paymentID]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-heading mb-2">Processing Payment</h1>
                        <p className="text-body-muted">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-heading mb-2">Payment Successful!</h1>
                        <p className="text-body-muted mb-4">{message}</p>
                        
                        {transactionId && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6">
                                <p className="text-sm text-body-muted">Transaction ID</p>
                                <p className="font-mono font-semibold text-heading">{transactionId}</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-3">
                            <Link href="/dashboard/payments">
                                <Button className="w-full" size="lg">
                                    View Payments
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="outline" className="w-full" size="lg">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-heading mb-2">Payment Issue</h1>
                        <p className="text-body-muted mb-6">{message}</p>
                        
                        <div className="flex flex-col gap-3">
                            <Link href="/dashboard/payments">
                                <Button className="w-full" size="lg">
                                    Try Again
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="outline" className="w-full" size="lg">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
            <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-heading mb-2">Loading...</h1>
                <p className="text-body-muted">Please wait...</p>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
