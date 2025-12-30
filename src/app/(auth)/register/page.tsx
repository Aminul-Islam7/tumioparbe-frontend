'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Step 1: Phone Schema
const PhoneSchema = Yup.object().shape({
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
});

// Step 2: OTP Schema
const OTPSchema = Yup.object().shape({
    otp: Yup.string()
        .matches(/^\d{4,6}$/, 'OTP must be 4-6 digits')
        .required('OTP is required'),
});

// Step 3: Registration Schema
const RegistrationSchema = Yup.object().shape({
    name: Yup.string().min(3, 'Name must be at least 3 characters').required('Name is required'),
    address: Yup.string().required('Address is required'),
    facebook_profile: Yup.string()
        .required('Facebook profile is required')
        .url('Please enter a valid URL'),
    email: Yup.string().email('Please enter a valid email address'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    confirm_password: Yup.string()
        .oneOf([Yup.ref('password'), ''], 'Passwords must match')
        .required('Please confirm your password'),
});

interface RegistrationValues {
    name: string;
    address: string;
    facebook_profile: string;
    email?: string;
    password: string;
    confirm_password: string;
}

interface ApiErrorResponse extends Error {
    message: string;
    response?: {
        data: {
            error?: string;
            message?: string;
        };
    };
}

export default function Register() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

    // Step 1: Request OTP
    const handlePhoneSubmit = async (values: { phone: string }) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            await authApi.requestOtp(values.phone);
            setPhone(values.phone);
            setSuccessMessage('OTP sent! Please check your phone for verification code.');
            setTimeout(() => setCurrentStep(2), 500);
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('OTP request error:', error);
            setErrorMessage(
                apiError.response?.data?.message || apiError.message || 'Failed to send OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleOtpVerify = async (values: { otp: string }) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            await authApi.verifyOtp(phone, values.otp);
            setSuccessMessage('Phone verified! Please complete your registration.');
            setTimeout(() => setCurrentStep(3), 500);
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('OTP verification error:', error);
            setErrorMessage(
                apiError.response?.data?.message ||
                    apiError.message ||
                    'Invalid code. Please check and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete Registration
    const handleRegistration = async (values: RegistrationValues) => {
        try {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            // Combine phone with registration data
            const registrationData = {
                ...values,
                phone,
            };

            const response = await authApi.register(registrationData);

            // Login the user after successful registration
            if (response.data.success) {
                login(
                    { access: response.data.access, refresh: response.data.refresh },
                    response.data.user
                );

                setSuccessMessage('Registration successful! Welcome to Tumio Parbe!');
                setTimeout(() => router.push('/dashboard'), 500);
            }
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('Registration error:', error);
            setErrorMessage(
                apiError.response?.data?.message ||
                    apiError.message ||
                    'Registration failed. Please check your information and try again.'
            );
        } finally {
            setLoading(false);
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
                            <Form className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">
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
                                    {loading ? 'Sending...' : 'Next'}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                );

            case 2:
                return (
                    <Formik
                        initialValues={{ otp: '' }}
                        validationSchema={OTPSchema}
                        onSubmit={handleOtpVerify}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-center mb-2">
                                        <p className="text-muted-foreground">
                                            Enter the verification code sent to
                                            <p className="font-medium text-primary">
                                                {phone}
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="text-sm text-body-muted px-2"
                                                    onClick={() => setCurrentStep(1)}
                                                >
                                                    (Change)
                                                </Button>
                                            </p>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="otp" className="text-sm font-medium">
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
                                            className="text-red-500 text-sm"
                                        />
                                    </div>
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

                                <div className="flex flex-col space-y-2">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={loading}
                                    >
                                        {loading ? 'Verifying...' : 'Verify OTP'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-sm"
                                        disabled={countdown > 0}
                                        onClick={async () => {
                                            try {
                                                setCountdown(60);
                                                setErrorMessage('');
                                                setSuccessMessage('');
                                                await authApi.requestOtp(phone);
                                                setSuccessMessage('OTP resent! Please check your phone for a new verification code.');
                                            } catch (error) {
                                                const apiError = error as ApiErrorResponse;
                                                setErrorMessage(
                                                    apiError.response?.data?.message ||
                                                        apiError.message ||
                                                        'Failed to resend OTP. Please try again.'
                                                );
                                            }
                                        }}
                                    >
                                        Resend Code {countdown > 0 ? `(${countdown}s)` : ''}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                );

            case 3:
                return (
                    <Formik
                        initialValues={{
                            name: '',
                            address: '',
                            facebook_profile: '',
                            email: '',
                            password: '',
                            confirm_password: '',
                        }}
                        validationSchema={RegistrationSchema}
                        onSubmit={handleRegistration}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-4">
                                <div className="text-center mb-2">
                                    <p className="text-sm text-muted-foreground">
                                        Phone number:{' '}
                                        <span className="font-medium text-primary">{phone}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Parent&apos;s Name *
                                    </label>
                                    <Field
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Name of Father or Mother"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                            errors.name && touched.name
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="name"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="address" className="text-sm font-medium">
                                        Address *
                                    </label>
                                    <Field
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="Your address"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                            errors.address && touched.address
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="address"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="facebook_profile"
                                        className="text-sm font-medium"
                                    >
                                        Facebook Profile URL *
                                    </label>
                                    <Field
                                        id="facebook_profile"
                                        name="facebook_profile"
                                        type="text"
                                        placeholder="https://facebook.com/your.username"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                            errors.facebook_profile && touched.facebook_profile
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="facebook_profile"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email Address (Optional)
                                    </label>
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your.email@example.com"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                            errors.email && touched.email
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="email"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password *
                                    </label>
                                    <Field
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
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

                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirm_password"
                                        className="text-sm font-medium"
                                    >
                                        Confirm Password *
                                    </label>
                                    <Field
                                        id="confirm_password"
                                        name="confirm_password"
                                        type="password"
                                        placeholder="••••••••"
                                        className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                            errors.confirm_password && touched.confirm_password
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="confirm_password"
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
                                    className="w-full text-md hover:opacity-90 transition-opacity"
                                    disabled={loading}
                                >
                                    {loading ? 'Registering...' : 'Complete Registration'}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="text-center space-y-2">
                <h1 className="text-xl font-bold md:text-3xl">Create Parent Account</h1>
                <p className="text-muted-foreground">One account for all your children</p>
            </div>

            {/* Step indicators */}
            <div className="flex justify-between items-center mb-6 mt-6">
                <div className="flex flex-col items-center">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${
                            currentStep >= 1
                                ? 'bg-primary text-white shadow-bubblegum'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted'
                        }`}
                    >
                        {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
                    </div>
                    <span className="text-xs mt-1 text-text-secondary">Phone</span>
                </div>

                <div className="h-1 flex-1 bg-neutral-200 dark:bg-neutral-700 mx-2 mb-5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-normal rounded-full"
                        style={{ width: currentStep > 1 ? '100%' : '0%' }}
                    />
                </div>

                <div className="flex flex-col items-center">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${
                            currentStep >= 2
                                ? 'bg-primary text-white shadow-bubblegum'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted'
                        }`}
                    >
                        {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : <span>2</span>}
                    </div>
                    <span className="text-xs mt-1 text-text-secondary">Verify</span>
                </div>

                <div className="h-1 flex-1 bg-neutral-200 dark:bg-neutral-700 mx-2 mb-5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-normal rounded-full"
                        style={{ width: currentStep > 2 ? '100%' : '0%' }}
                    />
                </div>

                <div className="flex flex-col items-center ">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${
                            currentStep >= 3
                                ? 'bg-primary text-white shadow-bubblegum'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-body-muted'
                        }`}
                    >
                        {currentStep > 3 ? <CheckCircle className="h-5 w-5" /> : <span>3</span>}
                    </div>
                    <span className="text-xs mt-1 text-text-secondary">Details</span>
                </div>
            </div>

            {/* Step Content */}
            <div className="mt-4">{renderStepContent()}</div>

            {/* Login link */}
            <div className="text-center pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-body-muted">Already have an account?</span>{' '}
                <Link href="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                    Log in
                </Link>
            </div>
        </>
    );
}
