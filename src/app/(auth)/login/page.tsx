'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import { setAuthTokens } from '@/lib/auth';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

const LoginSchema = Yup.object().shape({
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

export default function Login() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (values: { phone: string; password: string }) => {
        try {
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            // First get the auth tokens
            const tokenResponse = await authApi.login(values.phone, values.password);

            // Explicitly set auth tokens in localStorage before making the next request
            setAuthTokens(tokenResponse.data);

            // Then fetch the user profile with the new token
            const userResponse = await userApi.getProfile();
            const userData: User = userResponse.data;

            // Store auth tokens and user data in the auth store
            login(tokenResponse.data, userData);

            setSuccessMessage('Login successful! Redirecting...');

            // Redirect to dashboard
            setTimeout(() => {
                if (userData.is_admin) {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            }, 500);
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Invalid phone number or password. Please try again.';
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mx-auto mb-2">
                    <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-heading">Welcome Back</h1>
                <p className="text-body-muted">
                    Sign in to continue your journey
                </p>
            </div>

            <Formik
                initialValues={{ phone: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched }) => (
                    <Form className="space-y-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="phone"
                                className="text-sm font-medium text-heading"
                            >
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-heading"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Field
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className={`flex h-12 w-full rounded-xl border bg-card dark:bg-card/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                    errors.password && touched.password
                                        ? 'border-error'
                                        : 'border-neutral-200 dark:border-neutral-700'
                                }`}
                            />
                            <ErrorMessage
                                name="password"
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </Button>
                    </Form>
                )}
            </Formik>

            <div className="text-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-body-muted">Don&apos;t have an account?</span>{' '}
                <Link href="/register" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                    Register
                </Link>
            </div>
        </div>
    );
}
