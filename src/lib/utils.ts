import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function validateBangladeshiPhone(phone: string): boolean {
    const regex = /^01[3-9]\d{8}$/;
    return regex.test(phone);
}

export function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
