import api from './api';

export interface SmsResponse {
    success: boolean;
    message_id?: string;
    error?: string;
}

// This is a client-side utility for tracking/displaying SMS related information
// Actual SMS sending happens on the server side

export function formatPhoneForDisplay(phone: string): string {
    if (!phone || phone.length !== 11) return phone;
    return `${phone.slice(0, 5)}*****`;
}

export function getSmsRemainingTime(expiryTimestamp: number): number {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiryTimestamp - now;
    return Math.max(0, remaining);
}

export function formatSmsRemainingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function checkSmsQuota(): Promise<number> {
    try {
        // This would be a real API call in a production app
        const response = await api.get('/accounts/sms-quota/');
        return response.data.remaining || 0;
    } catch (error) {
        console.error('Failed to check SMS quota', error);
        return 0;
    }
}
