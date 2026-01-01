'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { CheckCircle, AlertCircle, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';

// Step 1: Phone Schema
const PhoneSchema = Yup.object().shape({
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
});

// Step 2: OTP and New Password Schema
const ResetPasswordSchema = Yup.object().shape({
    otp: Yup.string()
        .matches(/^\d{4,6}$/, 'OTP must be 4-6 digits')
        .required('OTP is required'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), ''], 'Passwords must match')
        .required('Please confirm your password'),
});

interface ApiErrorResponse extends Error {
    message: string;
    response?: {
        data: {
            error?: string;
            message?: string;
            detail?: string;
        };
    };
}

export default function ForgotPassword() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
        }
    }, [router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (currentStep === 2 && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [currentStep, countdown]);

    // Reset countdown when moving to OTP step
    useEffect(() => {
        if (currentStep === 2) {
            setCountdown(60);
        }
    }, [currentStep]);

    // Step 1: Request Password Reset OTP
    const handlePhoneSubmit = async (values: { phone: string }) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            await authApi.requestPasswordResetOtp(values.phone);
            setPhone(values.phone);
            setSuccessMessage('OTP sent! Please check your phone for the verification code.');
            setTimeout(() => setCurrentStep(2), 500);
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            setErrorMessage(
                apiError.response?.data?.message || 
                apiError.response?.data?.detail || 
                apiError.message || 
                'Failed to send OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password with OTP
    const handleResetPassword = async (values: { otp: string; newPassword: string; confirmPassword: string }) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            await authApi.resetPassword(phone, values.otp, values.newPassword, values.confirmPassword);
            setSuccessMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            setErrorMessage(
                apiError.response?.data?.message ||
                apiError.response?.data?.detail ||
                apiError.message ||
                'Failed to reset password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP handler
    const handleResendOtp = async () => {
        try {
            setCountdown(60);
            setErrorMessage('');
            setSuccessMessage('');
            await authApi.requestPasswordResetOtp(phone);
            setSuccessMessage('OTP resent! Please check your phone for a new verification code.');
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            setErrorMessage(
                apiError.response?.data?.message ||
                apiError.response?.data?.detail ||
                apiError.message ||
                'Failed to resend OTP. Please try again.'
            );
        }
    };

    // Content for each step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Formik
                        initialValues={{ phone: '' }}
                        validationSchema={PhoneSchema}
                        onSubmit={handlePhoneSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-heading">
                                        Phone Number
                                    </label>
                                    <Field
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        placeholder="01XXXXXXXXX"
                                        className={`flex h-12 w-full rounded-xl border bg-card dark:bg-card/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.phone && touched.phone
                                                ? 'border-error'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="phone"
                                        component="div"
                                        className="text-error text-sm"
                                    />
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-error-light border border-error/20">
                                        <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-error-dark">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Success Message */}
                                {successMessage && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{successMessage}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                );

            case 2:
                return (
                    <Formik
                        initialValues={{ otp: '', newPassword: '', confirmPassword: '' }}
                        validationSchema={ResetPasswordSchema}
                        onSubmit={handleResetPassword}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-5">
                                <div className="text-center mb-2">
                                    <p className="text-body-muted">
                                        Enter the verification code sent to
                                        <span className="block font-medium text-primary">
                                            {phone}
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="text-sm text-body-muted px-2"
                                                onClick={() => setCurrentStep(1)}
                                            >
                                                (Change)
                                            </Button>
                                        </span>
                                    </p>
                                </div>

                                {/* OTP Field */}
                                <div className="space-y-2">
                                    <label htmlFor="otp" className="text-sm font-medium text-heading">
                                        Verification Code
                                    </label>
                                    <Field
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        placeholder="Enter OTP"
                                        className={`flex h-12 w-full rounded-xl border bg-card dark:bg-card/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.otp && touched.otp
                                                ? 'border-error'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="otp"
                                        component="div"
                                        className="text-error text-sm"
                                    />
                                </div>

                                {/* New Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium text-heading">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className={`flex h-12 w-full rounded-xl border bg-card dark:bg-card/50 px-4 py-2 pr-12 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                                errors.newPassword && touched.newPassword
                                                    ? 'border-error'
                                                    : 'border-neutral-200 dark:border-neutral-700'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="newPassword"
                                        component="div"
                                        className="text-error text-sm"
                                    />
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium text-heading">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className={`flex h-12 w-full rounded-xl border bg-card dark:bg-card/50 px-4 py-2 pr-12 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                                errors.confirmPassword && touched.confirmPassword
                                                    ? 'border-error'
                                                    : 'border-neutral-200 dark:border-neutral-700'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="confirmPassword"
                                        component="div"
                                        className="text-error text-sm"
                                    />
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-error-light border border-error/20">
                                        <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-error-dark">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Success Message */}
                                {successMessage && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{successMessage}</p>
                                    </div>
                                )}

                                <div className="flex flex-col space-y-2">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={loading}
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-sm"
                                        disabled={countdown > 0}
                                        onClick={handleResendOtp}
                                    >
                                        Resend Code {countdown > 0 ? `(${countdown}s)` : ''}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mx-auto mb-2">
                    <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-heading">Forgot Password?</h1>
                <p className="text-body-muted">
                    {currentStep === 1
                        ? "No worries! Enter your phone number and we'll send you a verification code."
                        : 'Enter the code and set your new password.'}
                </p>
            </div>

            {/* Step Content */}
            <div>{renderStepContent()}</div>

            {/* Back to Login link */}
            <div className="text-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
