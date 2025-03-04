'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { authApi, userApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import { formatPhoneForDisplay, getSmsRemainingTime, formatSmsRemainingTime } from '@/lib/sms';

const OtpSchema = Yup.object().shape({
    otp: Yup.string().length(4, 'OTP must be 4 digits').required('OTP is required'),
});

export default function Verify() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthStore();
    const { showSuccess, showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // Get query params
    const phone = searchParams.get('phone') || '';
    const action = searchParams.get('action') || 'register';
    const expiryTimestamp = parseInt(searchParams.get('expiry') || '0');

    // Timer for OTP expiration
    useEffect(() => {
        if (expiryTimestamp > 0) {
            setRemainingTime(getSmsRemainingTime(expiryTimestamp));

            const timer = setInterval(() => {
                const remaining = getSmsRemainingTime(expiryTimestamp);
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        } else {
            // If no expiry timestamp, set a default of 5 minutes
            const defaultExpiry = Math.floor(Date.now() / 1000) + 300; // 5 minutes
            setRemainingTime(300); // 5 minutes in seconds

            const timer = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [expiryTimestamp]);

    // Handle OTP input change
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Take only the first character if multiple were pasted
            value = value.charAt(0);
        }

        // Update the OTP digit
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);

        // If a digit is entered and there's a next input, focus it
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    // Handle key press for backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // If backspace is pressed and current field is empty, focus previous field
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    // Handle paste event
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Check if pasted content has exactly 4 digits
        if (/^\d{4}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpDigits(digits);

            // Focus the last input
            inputRefs[3].current?.focus();
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const otp = otpDigits.join('');

            // Verify OTP
            const response = await authApi.verifyOtp(phone, otp);

            if (response.data.success) {
                if (action === 'register') {
                    // Get stored registration data
                    const registrationDataStr = sessionStorage.getItem('registrationData');

                    if (!registrationDataStr) {
                        showError(
                            'Registration Failed',
                            'Registration data not found. Please try registering again.'
                        );
                        router.push('/register');
                        return;
                    }

                    const registrationData = JSON.parse(registrationDataStr);

                    try {
                        // Complete registration
                        const registerResponse = await authApi.register(registrationData);

                        if (registerResponse.data.success) {
                            // Store auth tokens and user data
                            login(
                                {
                                    access: registerResponse.data.access,
                                    refresh: registerResponse.data.refresh,
                                },
                                registerResponse.data.user
                            );

                            // Clear stored data
                            sessionStorage.removeItem('registrationData');

                            showSuccess(
                                'Registration Successful',
                                'Your account has been created successfully.'
                            );

                            // Redirect to dashboard
                            router.push('/dashboard');
                        }
                    } catch (registerError) {
                        console.error('Registration error:', registerError);
                        showError(
                            'Registration Failed',
                            'There was a problem completing your registration.'
                        );
                        router.push('/register');
                    }
                } else if (action === 'login') {
                    // Handle login after OTP verification for password reset or other flows
                    showSuccess('Verification Successful', '');
                    router.push('/login');
                }
            }
        } catch (error) {
            console.error('Verification error:', error);
            showError(
                'Verification Failed',
                'Invalid or expired verification code. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle OTP resend
    const handleResendOtp = async () => {
        try {
            setIsResending(true);

            // Request new OTP
            const response = await authApi.requestOtp(phone);

            if (response.data.success) {
                // Update expiry time
                const newExpiryTimestamp = Math.floor(Date.now() / 1000) + response.data.expires_in;

                router.push(`/verify?phone=${phone}&action=${action}&expiry=${newExpiryTimestamp}`);

                showSuccess('Code Resent', 'A new verification code has been sent to your phone.');
            }
        } catch (error) {
            console.error('OTP resend error:', error);
            showError(
                'Failed to Resend Code',
                'There was a problem sending a new code. Please try again.'
            );
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Verify Your Phone</h1>
                <p className="text-muted-foreground">
                    Enter the 4-digit code sent to {formatPhoneForDisplay(phone)}
                </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
                <div className="flex justify-center space-x-2 w-full max-w-xs">
                    {[0, 1, 2, 3].map((index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="text"
                            maxLength={1}
                            value={otpDigits[index]}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="w-14 h-14 text-center text-2xl font-bold rounded-md border border-input bg-background focus:border-bubblegum focus:ring-1 focus:ring-bubblegum focus-visible:outline-none"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                        />
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Time remaining: {formatSmsRemainingTime(remainingTime)}
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        className="text-bubblegum hover:text-purple hover:bg-bubblegum/10"
                        disabled={remainingTime > 0 || isResending}
                        onClick={handleResendOtp}
                    >
                        {isResending
                            ? 'Sending...'
                            : remainingTime > 0
                              ? 'Wait to resend'
                              : 'Resend Code'}
                    </Button>
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full max-w-xs bg-gradient-to-r from-bubblegum to-skyblue hover:opacity-90 transition-opacity"
                    disabled={otpDigits.join('').length !== 4 || isSubmitting}
                >
                    {isSubmitting ? 'Verifying...' : 'Verify'}
                </Button>
            </div>
        </div>
    );
}
