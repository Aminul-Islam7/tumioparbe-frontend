'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle } from 'lucide-react';

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
    const toast = useToast();
    const { login } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

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
            await authApi.requestOtp(values.phone);
            setPhone(values.phone);
            setCurrentStep(2);
            toast.showSuccess('OTP Sent', 'Please check your phone for verification code');
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('OTP request error:', error);
            toast.showError(
                'Failed to send OTP',
                apiError.response?.data?.message || apiError.message || 'Please try again'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleOtpVerify = async (values: { otp: string }) => {
        try {
            setLoading(true);
            await authApi.verifyOtp(phone, values.otp);
            setCurrentStep(3);
            toast.showSuccess('Phone Verified', 'Please complete your registration');
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('OTP verification error:', error);
            toast.showError(
                'Invalid Code',
                apiError.response?.data?.message ||
                    apiError.message ||
                    'Please check the code and try again'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete Registration
    const handleRegistration = async (values: RegistrationValues) => {
        try {
            setLoading(true);
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

                toast.showSuccess('Registration Successful', 'Welcome to Tumio Parbe!');
                router.push('/dashboard');
            }
        } catch (error) {
            const apiError = error as ApiErrorResponse;
            console.error('Registration error:', error);
            toast.showError(
                'Registration Failed',
                apiError.response?.data?.message ||
                    apiError.message ||
                    'Please check your information and try again'
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
                                        className={`flex h-10 w-full rounded-md border dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
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

                                <Button
                                    type="submit"
                                    className="w-full text-md hover:opacity-90 transition-opacity"
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
                                            <p className="font-medium text-bubblegum">
                                                {phone}
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="text-sm text-text-secondary px-2"
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
                                            className={`flex h-10 w-full rounded-md border bg-background dark:bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubblegum focus-visible:ring-offset-2 ${
                                                errors.otp && touched.otp
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
                                        />
                                        <ErrorMessage
                                            name="otp"
                                            component="div"
                                            className="text-red-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Button
                                        type="submit"
                                        className="w-full text-md hover:opacity-90 transition-opacity"
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
                                                await authApi.requestOtp(phone);
                                                toast.showSuccess(
                                                    'OTP Resent',
                                                    'Please check your phone for a new verification code'
                                                );
                                            } catch (error) {
                                                const apiError = error as ApiErrorResponse;
                                                toast.showError(
                                                    'Failed to resend OTP',
                                                    apiError.response?.data?.message ||
                                                        apiError.message ||
                                                        'Please try again'
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
                                        <span className="font-medium text-bubblegum">{phone}</span>
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep >= 1
                                ? 'bg-tp_red text-white'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
                    </div>
                    <span className="text-xs mt-1 text-text-secondary">Phone</span>
                </div>

                <div className="h-0.5 flex-1 bg-border mx-2 mb-5">
                    <div
                        className="h-full bg-tp_red transition-all duration-300"
                        style={{ width: currentStep > 1 ? '100%' : '0%' }}
                    />
                </div>

                <div className="flex flex-col items-center">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep >= 2
                                ? 'bg-tp_red text-white'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : <span>2</span>}
                    </div>
                    <span className="text-xs mt-1 text-text-secondary">Verify</span>
                </div>

                <div className="h-0.5 flex-1 bg-border mx-2 mb-5">
                    <div
                        className="h-full bg-tp_red transition-all duration-300"
                        style={{ width: currentStep > 2 ? '100%' : '0%' }}
                    />
                </div>

                <div className="flex flex-col items-center ">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            currentStep >= 3
                                ? 'bg-tp_red text-white'
                                : 'bg-muted text-muted-foreground'
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
            <div className="text-center pt-4 mt-6 border-t">
                <span className="text-muted-foreground">Already have an account?</span>{' '}
                <Link href="/login" className="text-bubblegum hover:text-tp_red font-medium">
                    Log in
                </Link>
            </div>
        </>
    );
}
