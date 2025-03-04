'use client';

import React from 'react';
import { toast, ToastOptions, TypeOptions, Bounce, Slide, Zoom, Flip } from 'react-toastify';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

type ToastFunction = (title: string, message?: string, options?: ToastOptions) => void;

interface ToastApi {
    showSuccess: ToastFunction;
    showError: ToastFunction;
    showWarning: ToastFunction;
    showInfo: ToastFunction;
    toast: typeof toast;
}

// Icon mapping for different toast types
const ToastIcon = {
    success: () => <CheckCircle className="h-5 w-5" />,
    error: () => <XCircle className="h-5 w-5" />,
    warning: () => <AlertCircle className="h-5 w-5" />,
    info: () => <Info className="h-5 w-5" />,
    default: () => <Info className="h-5 w-5" />,
};

// Default toast options
const defaultOptions: ToastOptions = {
    position: 'top-center',
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: false,
    theme: 'colored',
    transition: Slide,
};

/**
 * Custom hook for showing toast notifications
 */
export function useToast(): ToastApi {
    const showToast = (
        type: TypeOptions,
        title: string,
        message?: string,
        options?: ToastOptions
    ) => {
        const Icon = ToastIcon[type as keyof typeof ToastIcon] || ToastIcon.default;

        const content = (
            <div className="toast-body">
                {/* <div className="toast-icon">
                    <Icon />
                </div> */}
                <div className="toast-content">
                    <div className="toast-title font-bold">{title}</div>
                    {message && <div className="toast-message">{message}</div>}
                </div>
            </div>
        );

        toast(content, {
            ...defaultOptions,
            type,
            ...options,
        });
    };

    return {
        showSuccess: (title: string, message?: string, options?: ToastOptions) =>
            showToast('success', title, message, options),

        showError: (title: string, message?: string, options?: ToastOptions) =>
            showToast('error', title, message, options),

        showWarning: (title: string, message?: string, options?: ToastOptions) =>
            showToast('warning', title, message, options),

        showInfo: (title: string, message?: string, options?: ToastOptions) =>
            showToast('info', title, message, options),

        toast, // Expose the original toast function for advanced usage
    };
}

export default useToast;
