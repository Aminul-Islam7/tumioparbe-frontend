'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { User } from '@/types';
import { setAuthTokens } from '@/lib/auth';

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
    const { showSuccess, showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values: { phone: string; password: string }) => {
        try {
            setIsSubmitting(true);

            // First get the auth tokens
            const tokenResponse = await authApi.login(values.phone, values.password);

            // Explicitly set auth tokens in localStorage before making the next request
            // This ensures the interceptor will have access to the token
            setAuthTokens(tokenResponse.data);

            // Then fetch the user profile with the new token
            const userResponse = await userApi.getProfile();
            const userData: User = userResponse.data;

            // Store auth tokens and user data in the auth store
            login(tokenResponse.data, userData);

            showSuccess('Login successful', 'Welcome back!');

            // Redirect to dashboard
            if (userData.is_admin) {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Login failed', 'Please check your phone number and password.');
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
