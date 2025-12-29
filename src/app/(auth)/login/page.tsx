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
import { AlertCircle, CheckCircle } from 'lucide-react';

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
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="text-muted-foreground">
                    {/* Enter your phone number and password to access your account */}
                </p>
            </div>

            <Formik
                initialValues={{ phone: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched }) => (
                    <Form className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="phone"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Phone Number
                            </label>
                            <Field
                                id="phone"
                                name="phone"
                                type="text"
                                placeholder="01XXXXXXXXX"
                                className={`flex h-10 w-full rounded-md border dark:bg-background/50 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                    errors.phone && touched.phone
                                        ? 'border-red-500'
                                        : 'border-input'
                                }`}
                            />
                            <ErrorMessage
                                name="phone"
                                component="div"
                                className="text-red-500 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-bubblegum hover:text-tp_red transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Field
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className={`flex h-10 w-full rounded-md border dark:bg-background/50 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                    errors.password && touched.password
                                        ? 'border-red-500'
                                        : 'border-input'
                                }`}
                            />
                            <ErrorMessage
                                name="password"
                                component="div"
                                className="text-red-500 text-sm"
                            />
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-tp_red text-white font-bold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </Button>
                    </Form>
                )}
            </Formik>

            <div className="text-center">
                <span className="text-muted-foreground">Don&apos;t have an account?</span>{' '}
                <Link href="/register" className="text-bubblegum hover:text-tp_red font-medium">
                    Register
                </Link>
            </div>
        </div>
    );
}
