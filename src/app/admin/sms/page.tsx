'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    MessageSquare, Send, CheckCircle2, XCircle, Clock, AlertCircle,
    Search, RefreshCw, ChevronDown, ChevronUp, X, Filter, Eye, Copy,
    BookOpen, GraduationCap, Check, Minus, Users, UserCheck, Layers, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Select } from '@/components/ui/select';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SMSLog {
    id: number;
    phone_number: string;
    message: string;
    message_type: string;
    message_type_display: string;
    status: string;
    status_display: string;
    sent_by: number | null;
    sent_by_name: string | null;
    recipient_count: number;
    successful_count: number;
    failed_count: number;
    cost_per_unit?: number | string;
    total_cost?: number | string;
    api_response?: any;
    recipients_list?: string[];
    created_at: string;
    updated_at: string;
}

interface Course {
    id: number;
    name: string;
    batches: Batch[];
}

interface Batch {
    id: number;
    name: string;
    students: RecipientStudent[];
}

interface RecipientStudent {
    student_id: number;
    student_name: string;
    parent_name: string;
    phone: string;
}

interface SelectedRecipient {
    student_id: number;
    student_name: string;
    parent_name: string;
    phone: string;
    course_name?: string;
    batch_name?: string;
}

// ─── Options & Config ────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'OTP', label: 'OTP' },
    { value: 'PAYMENT_REMINDER', label: 'Payment Reminder' },
    { value: 'ENROLLMENT_CONFIRMATION', label: 'Enrollment' },
    { value: 'CUSTOM', label: 'Custom' },
    { value: 'BULK', label: 'Bulk' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PARTIAL_SUCCESS', label: 'Partial' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DISABLED', label: 'Disabled' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
    SUCCESS: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" /> },
    FAILED: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> },
    PARTIAL_SUCCESS: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: <AlertCircle className="w-4 h-4" /> },
    PENDING: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', icon: <Clock className="w-4 h-4" /> },
    DISABLED: { color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800', icon: <XCircle className="w-4 h-4" /> },
};

const TYPE_COLOR: Record<string, string> = {
    OTP: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
    PAYMENT_REMINDER: 'text-primary bg-primary-50 dark:bg-primary-900/20',
    ENROLLMENT_CONFIRMATION: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    CUSTOM: 'text-secondary bg-secondary-50 dark:bg-secondary-900/20',
    BULK: 'text-tangerine-600 bg-tangerine-50 dark:bg-tangerine-900/20',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dt: string) {
    return new Date(dt).toLocaleString('en-BD', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function smsUnits(msg: string) {
    const len = msg.length;
    if (len === 0) return { chars: 0, units: 0, isBangla: false, isUnicode: false, perSms: 160 };
    const hasBangla = /[\u0980-\u09FF]/.test(msg);
    const isUnicode = hasBangla || /[^\x00-\x7F]/.test(msg);
    const perSms = isUnicode ? 70 : 160;
    const units = Math.ceil(len / perSms);
    return { chars: len, units, isBangla: hasBangla, isUnicode, perSms };
}

function renderTemplateMessage(template: string, recipient: SelectedRecipient) {
    return template
        .replace(/\{\{STUDENT_NAME\}\}/g, recipient.student_name)
        .replace(/\{\{PARENT_NAME\}\}/g, recipient.parent_name)
        .replace(/\{\{COURSE_NAME\}\}/g, recipient.course_name || '')
        .replace(/\{\{BATCH_NAME\}\}/g, recipient.batch_name || '');
}

// ─── Sliding Switch Component ───────────────────────────────────────────────

interface SlidingSwitchProps<T extends string> {
    options: { key: T; label: string; icon?: React.ReactNode }[];
    value: T;
    onChange: (val: T) => void;
    className?: string;
}

function SlidingSwitch<T extends string>({ options, value, onChange, className }: SlidingSwitchProps<T>) {
    const [hovered, setHovered] = useState<T | null>(null);

    const activeIndex = options.findIndex(o => o.key === value);
    const hoveredIndex = hovered ? options.findIndex(o => o.key === hovered) : -1;
    const targetIndex = hoveredIndex >= 0 ? hoveredIndex : activeIndex;
    const isHoverPreview = hoveredIndex >= 0 && hoveredIndex !== activeIndex;

    const widthPct = 100 / options.length;

    return (
        <div className={cn('relative flex rounded-xl border border-default bg-input p-1 select-none', className)}>
            <div
                className={cn(
                    'absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out shadow-sm pointer-events-none',
                    isHoverPreview
                        ? 'bg-primary/30 dark:bg-primary/40'
                        : 'bg-primary'
                )}
                style={{
                    left: `calc(${targetIndex * widthPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                }}
            />
            {options.map(opt => {
                const isPillUnderThis = opt.key === (hovered ?? value);
                return (
                    <button
                        key={opt.key}
                        type="button"
                        onClick={() => onChange(opt.key)}
                        onMouseEnter={() => setHovered(opt.key)}
                        onMouseLeave={() => setHovered(null)}
                        className={cn(
                            'relative z-10 flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap',
                            isPillUnderThis
                                ? isHoverPreview
                                    ? 'text-primary font-bold'
                                    : 'text-white font-bold'
                                : 'text-body-muted hover:text-heading'
                        )}
                    >
                        {opt.icon}
                        <span className="whitespace-nowrap">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Custom Tri-State Checkbox ──────────────────────────────────────────────

function TriStateCheckbox({ state, onClick }: { state: 'all' | 'some' | 'none'; onClick?: (e: React.MouseEvent) => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-0.5 text-body-muted hover:text-primary transition-colors focus:outline-none shrink-0 cursor-pointer"
        >
            {state === 'all' && (
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
            )}
            {state === 'some' && (
                <div className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center shadow-xs">
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
            )}
            {state === 'none' && (
                <div className="w-5 h-5 rounded-md border-2 border-neutral-300 dark:border-neutral-600 bg-card hover:border-primary transition-colors" />
            )}
        </button>
    );
}

// ─── SMS Log Mobile Card (Mobile View) ───────────────────────────────────────

function SMSLogMobileCard({ log, onClick }: { log: SMSLog; onClick: () => void }) {
    const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;

    return (
        <div
            onClick={onClick}
            className="bg-card rounded-2xl border border-default p-4 shadow-sm space-y-3 cursor-pointer hover:border-primary/50 transition-all"
        >
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', TYPE_COLOR[log.message_type] || 'text-body-muted bg-neutral-100')}>
                    {log.message_type_display}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', sc.color)}>
                    {sc.icon}
                    {log.status_display}
                </span>
            </div>

            <div>
                <p className="text-sm text-heading font-medium line-clamp-2 leading-relaxed">
                    {log.message}
                </p>
            </div>

            <div className="pt-3 border-t border-default flex flex-col gap-1.5 text-xs text-body-muted">
                <div className="flex justify-between items-center flex-wrap gap-1">
                    <span>
                        To: <span className="font-mono text-body font-semibold">{log.phone_number}</span>
                        {log.recipient_count > 1 && (
                            <span className="ml-1 text-xs font-semibold text-primary">
                                (+{log.recipient_count - 1} others)
                            </span>
                        )}
                    </span>
                    <span className="text-primary font-semibold text-xs hover:underline">View Details →</span>
                </div>
                <div className="flex justify-between items-center">
                    <span>{formatDate(log.created_at)}</span>
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-body font-medium px-2 py-0.5 rounded text-xs">
                        {log.successful_count} / {log.recipient_count} Sent
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── SMS Log Detail Modal ────────────────────────────────────────────────────

function SMSLogDetailModal({
    log,
    onClose,
}: {
    log: SMSLog | null;
    onClose: () => void;
}) {
    const [copiedMsg, setCopiedMsg] = useState(false);
    const [copiedPhones, setCopiedPhones] = useState(false);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!log || !mounted || typeof document === 'undefined') return null;

    const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;

    // Build recipient phone list (from api_response or fallback)
    let allPhones: string[] = [];
    if (log.recipients_list && log.recipients_list.length > 0) {
        allPhones = log.recipients_list;
    } else if (log.api_response && log.api_response.all_recipients && Array.isArray(log.api_response.all_recipients)) {
        allPhones = log.api_response.all_recipients;
    } else if (log.api_response && log.api_response.recipients && Array.isArray(log.api_response.recipients)) {
        allPhones = log.api_response.recipients;
    } else if (log.phone_number) {
        allPhones = log.phone_number.split(',').map((p: string) => p.trim()).filter(Boolean);
    }

    // Deduplicate unique phones
    const uniquePhones = Array.from(new Set(allPhones.map(p => p.trim()).filter(Boolean)));

    // Total messages count (matches rendered_messages if present, otherwise all_recipients / recipient_count)
    const renderedMessages = log.api_response?.rendered_messages || [];
    const totalMessagesCount = renderedMessages.length > 0
        ? renderedMessages.length
        : Math.max(log.recipient_count || 0, allPhones.length, 1);

    const hasPartialData = uniquePhones.length === 1 && totalMessagesCount > 1 && !log.api_response?.recipients;

    const stats = smsUnits(log.message);
    const costPerUnit = log.cost_per_unit != null ? Number(log.cost_per_unit) : 0.40;
    const totalCost = log.total_cost != null && Number(log.total_cost) > 0
        ? Number(log.total_cost).toFixed(2)
        : (stats.units * totalMessagesCount * costPerUnit).toFixed(2);

    const filteredPhones = uniquePhones.filter(p => p.includes(recipientSearch));

    const handleCopyMsg = () => {
        navigator.clipboard.writeText(log.message);
        setCopiedMsg(true);
        setTimeout(() => setCopiedMsg(false), 2000);
    };

    const handleCopyPhones = () => {
        navigator.clipboard.writeText(uniquePhones.join(', '));
        setCopiedPhones(true);
        setTimeout(() => setCopiedPhones(false), 2000);
    };

    // Status terminology labels
    const isFailed = log.status === 'FAILED';
    const isDisabled = log.status === 'DISABLED';
    const isSuccess = log.status === 'SUCCESS';
    const isPartial = log.status === 'PARTIAL';

    const countCardLabel = isFailed
        ? 'SMS Attempted'
        : isDisabled
        ? 'SMS (Disabled)'
        : 'Total Messages';

    return createPortal(
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-default flex items-center justify-between bg-page-subtle shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-heading text-base">SMS Log Details</h3>
                                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', TYPE_COLOR[log.message_type] || 'text-body-muted bg-neutral-100')}>
                                    {log.message_type_display}
                                </span>
                                <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', sc.color)}>
                                    {sc.icon}{log.status_display}
                                </span>
                            </div>
                            <p className="text-xs text-body-muted mt-0.5">{formatDate(log.created_at)}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-body-muted hover:text-heading hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

                    {/* Status Alert Banners */}
                    {isDisabled && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div>
                                <strong className="font-semibold block mb-0.5">SMS Gateway Disabled</strong>
                                SMS feature was disabled in settings when this request was created. Message logged for audit, but no real SMS was dispatched.
                            </div>
                        </div>
                    )}
                    {isFailed && (
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                            <div>
                                <strong className="font-semibold block mb-0.5">Dispatch Failed</strong>
                                Delivery attempt to gateway failed. Check gateway balance or API provider logs for details.
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-page-subtle p-3 rounded-2xl border border-default text-center">
                            <span className="text-[11px] text-body-muted block mb-0.5">Unique Recipients</span>
                            <span className="text-lg font-bold text-heading">{hasPartialData ? '?' : uniquePhones.length}</span>
                        </div>
                        <div className="bg-page-subtle p-3 rounded-2xl border border-default text-center">
                            <span className="text-[11px] text-body-muted block mb-0.5">{countCardLabel}</span>
                            <span className="text-lg font-bold text-heading">{totalMessagesCount}</span>
                        </div>
                        {/* Status Result Card */}
                        {isFailed ? (
                            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-200 dark:border-red-800 text-center">
                                <span className="text-[11px] text-red-600 dark:text-red-400 block mb-0.5">Failed SMS</span>
                                <span className="text-lg font-bold text-red-700 dark:text-red-300">{log.failed_count || totalMessagesCount}</span>
                            </div>
                        ) : isPartial ? (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-0.5">Sent / Failed</span>
                                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{log.successful_count} / {log.failed_count}</span>
                            </div>
                        ) : isDisabled ? (
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-2xl border border-default text-center">
                                <span className="text-[11px] text-body-muted block mb-0.5">Dispatched</span>
                                <span className="text-lg font-bold text-body-muted">0 (Disabled)</span>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-0.5">Successful</span>
                                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{log.successful_count}</span>
                            </div>
                        )}
                        <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 text-center">
                            <span className="text-[11px] text-primary block mb-0.5">Total Cost</span>
                            <span className="text-lg font-bold text-primary">৳ {totalCost}</span>
                        </div>
                    </div>

                    {/* Messages Section: per-recipient rendered OR single template */}
                    {renderedMessages.length > 0 ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Messages ({renderedMessages.length})
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {renderedMessages.map((rm: { phone: string; label: string; message: string }, i: number) => {
                                    const rmStats = smsUnits(rm.message);
                                    return (
                                        <div key={i} className="border border-default rounded-2xl p-3.5 bg-page-subtle/50 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-default/60">
                                                <span className="font-bold text-heading flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-primary" />
                                                    {rm.label}
                                                </span>
                                                <span className="font-mono text-body-muted">{rm.phone}</span>
                                            </div>
                                            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed font-sans bg-input p-3 rounded-xl border border-default">
                                                {rm.message}
                                            </p>
                                            <div className="flex items-center justify-between text-[11px] text-body-muted pt-0.5">
                                                <span>{rmStats.chars} chars · {rmStats.units} unit{rmStats.units !== 1 ? 's' : ''}</span>
                                                <span className="font-bold text-primary">৳ {(rmStats.units * costPerUnit).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-primary" />
                                    SMS Message Content
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyMsg}
                                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {copiedMsg ? 'Copied!' : 'Copy Message'}
                                </button>
                            </div>
                            <div className="bg-input p-4 rounded-2xl border border-default font-sans text-sm text-heading leading-relaxed whitespace-pre-wrap break-words">
                                {log.message}
                            </div>
                            <div className="flex flex-wrap items-center justify-between text-xs text-body-muted pt-1 px-1">
                                <span>{stats.chars} chars · {stats.isBangla ? 'Bangla (70 chars/unit)' : 'GSM-7 (160 chars/unit)'}</span>
                                <span>{stats.units} unit{stats.units !== 1 ? 's' : ''} per message · {stats.units * totalMessagesCount} total units</span>
                            </div>
                        </div>
                    )}

                    {/* Recipients Section */}
                    <div className="space-y-2.5 pt-2 border-t border-default">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-primary" />
                                {hasPartialData ? 'Recipient Numbers (partial)' : `Recipient Numbers (${uniquePhones.length})`}
                                {totalMessagesCount > uniquePhones.length && !hasPartialData && (
                                    <span className="text-[11px] text-body-muted font-normal normal-case tracking-normal">
                                        · {totalMessagesCount} messages to {uniquePhones.length} unique numbers
                                    </span>
                                )}
                            </span>
                            {!hasPartialData && (
                                <button
                                    type="button"
                                    onClick={handleCopyPhones}
                                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {copiedPhones ? 'Copied!' : 'Copy All'}
                                </button>
                            )}
                        </div>

                        {hasPartialData && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                                Full recipient list unavailable for this log — only the first number was recorded.
                            </p>
                        )}

                        {uniquePhones.length > 5 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-body-muted" />
                                <input
                                    value={recipientSearch}
                                    onChange={e => setRecipientSearch(e.target.value)}
                                    placeholder="Filter phone numbers…"
                                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-default bg-input text-xs text-heading outline-none focus:border-primary"
                                />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-3 bg-page-subtle rounded-2xl border border-default">
                            {filteredPhones.length === 0 ? (
                                <p className="text-xs text-body-muted py-2 px-1">No numbers match filter</p>
                            ) : (
                                filteredPhones.map((phone, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-mono font-medium bg-card border border-default text-heading shadow-xs">
                                        {phone}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-3 border-t border-default flex flex-col sm:flex-row justify-between gap-2 text-xs text-body-muted">
                        <span>Sent By: <strong className="text-heading">{log.sent_by_name || 'System Automated'}</strong></span>
                        <span>Log ID: <strong className="font-mono text-heading">#{log.id}</strong></span>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-default bg-page-subtle flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-heading text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}


// ─── SMS Logs Tab ────────────────────────────────────────────────────────────

function SMSLogsTab({
    selectedLog,
    setSelectedLog,
}: {
    selectedLog: SMSLog | null;
    setSelectedLog: (log: SMSLog | null) => void;
}) {
    const [logs, setLogs] = useState<SMSLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const hasActiveFilters = Boolean(search || typeFilter || statusFilter || startDate || endDate);
    const activeFiltersCount = [typeFilter, statusFilter, startDate, endDate].filter(Boolean).length;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {
                page: String(page),
                page_size: String(pageSize),
            };
            if (search) params.search = search;
            if (typeFilter) params.message_type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.get('/common/sms/', { params });
            setLogs(res.data.results || res.data);
            setTotal(res.data.count || (res.data.results || res.data).length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, typeFilter, statusFilter, startDate, endDate]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-2xl border border-default p-4 shadow-sm space-y-3">
                {/* Mobile Filter Toggle Bar */}
                <div className="flex md:hidden items-center justify-between gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search logs…"
                            className="w-full h-11 pl-9 pr-4 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className={cn(
                            'h-11 px-3.5 rounded-xl border border-default bg-input text-sm font-semibold flex items-center gap-2 transition-colors shrink-0',
                            showMobileFilters ? 'border-primary text-primary bg-primary/10' : 'text-heading'
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-white font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        aria-label="Refresh SMS logs"
                        title="Refresh"
                        className="h-11 w-11 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm inline-flex items-center justify-center shrink-0"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Controls (Desktop & Collapsible Mobile) */}
                <div className={cn(
                    'flex-col md:flex-row gap-3 items-stretch md:items-end flex-wrap',
                    showMobileFilters ? 'flex' : 'hidden md:flex'
                )}>
                    <div className="hidden md:block flex-1 min-w-[240px]">
                        <label className="text-xs font-semibold text-body-muted mb-1 block">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Phone or message…"
                                className="w-full h-11 pl-9 pr-4 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-44 shrink-0">
                        <label className="text-xs font-semibold text-body-muted mb-1 block">Type</label>
                        <Select
                            options={TYPE_OPTIONS}
                            value={typeFilter}
                            onChange={val => { setTypeFilter(String(val)); setPage(1); }}
                            placeholder="All Types"
                            className="w-full h-11"
                        />
                    </div>

                    <div className="w-full md:w-44 shrink-0">
                        <label className="text-xs font-semibold text-body-muted mb-1 block">Status</label>
                        <Select
                            options={STATUS_OPTIONS}
                            value={statusFilter}
                            onChange={val => { setStatusFilter(String(val)); setPage(1); }}
                            placeholder="All Statuses"
                            className="w-full h-11"
                        />
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex-1 md:flex-none">
                        <label className="text-xs font-semibold text-body-muted mb-1 block">From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            className="w-full h-11 px-3 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        />
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex-1 md:flex-none">
                        <label className="text-xs font-semibold text-body-muted mb-1 block">To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            className="w-full h-11 px-3 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={fetchLogs}
                        aria-label="Refresh SMS logs"
                        title="Refresh"
                        className="hidden md:inline-flex h-11 w-11 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm items-center justify-center shrink-0"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            title="Clear all active filters"
                            className="h-11 px-3.5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <X className="w-4 h-4" />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table (Desktop) & Cards (Mobile) */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-xl border border-default p-4 shadow-sm space-y-3 animate-pulse">
                            <div className="flex justify-between">
                                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
                                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
                                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
                            </div>
                            <div className="pt-3 border-t border-default flex justify-between">
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
                            </div>
                        </div>
                    ))
                ) : logs.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-default p-8 text-center text-body-muted text-sm">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No SMS logs found
                    </div>
                ) : (
                    logs.map(log => (
                        <SMSLogMobileCard
                            key={log.id}
                            log={log}
                            onClick={() => setSelectedLog(log)}
                        />
                    ))
                )}
            </div>

            {/* Desktop Table - Simplified with 5 Essential Columns */}
            <div className="hidden md:block bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                <div className="p-4 border-b border-default flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-heading text-base">SMS Logs</h3>
                        <p className="text-xs text-body-muted">Click any row to view complete recipients list, cost & details</p>
                    </div>
                    <span className="text-xs text-body-muted font-medium bg-page-subtle px-3 py-1 rounded-xl border border-default">{total} records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-default bg-page-subtle">
                                {['Time', 'Type', 'To / Recipients', 'Message Preview', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-body-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-default">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-body-muted text-sm">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        No SMS logs found
                                    </td>
                                </tr>
                            ) : logs.map(log => {
                                const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="border-b border-default hover:bg-page-subtle transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-3.5 text-sm text-body-muted whitespace-nowrap">{formatDate(log.created_at)}</td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', TYPE_COLOR[log.message_type] || 'text-body-muted bg-neutral-100')}>
                                                {log.message_type_display}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-sm text-body whitespace-nowrap">
                                            {log.phone_number}
                                            {log.recipient_count > 1 && (
                                                <span
                                                    title={`Sent to ${log.recipient_count} recipients`}
                                                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-semibold bg-primary/10 text-primary border border-primary/20"
                                                >
                                                    +{log.recipient_count - 1} others
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-body">
                                            <p className="truncate max-w-xs md:max-w-md text-heading font-medium group-hover:text-primary transition-colors">
                                                {log.message}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.color)}>
                                                    {sc.icon}{log.status_display}
                                                </span>
                                                <span className="text-xs font-mono font-medium text-body-muted bg-page-subtle px-2 py-0.5 rounded-md border border-default" title={`${log.successful_count} of ${log.recipient_count} SMS delivered`}>
                                                    {log.successful_count}/{log.recipient_count}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-default flex items-center justify-between">
                        <span className="text-xs text-body-muted">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-default rounded-xl bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-default rounded-xl bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Rendered SMS Preview Modal ──────────────────────────────────────────────

function SMSPreviewModal({
    isOpen,
    onClose,
    recipients,
    templateMessage,
    groupPerParent,
    smsRate = 0.40,
}: {
    isOpen: boolean;
    onClose: () => void;
    recipients: SelectedRecipient[];
    templateMessage: string;
    groupPerParent: boolean;
    smsRate?: number;
}) {
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted || typeof document === 'undefined') return null;

    // Build items to preview
    let previewItems: { label: string; phone: string; message: string; chars: number; units: number; cost: number }[] = [];

    if (groupPerParent) {
        // Group by phone
        const grouped: Record<string, SelectedRecipient[]> = {};
        recipients.forEach(r => {
            if (!grouped[r.phone]) grouped[r.phone] = [];
            grouped[r.phone].push(r);
        });

        previewItems = Object.entries(grouped).map(([phone, recList]) => {
            const isManual = recList[0].student_id < 0;
            if (isManual) {
                const stats = smsUnits(templateMessage);
                return {
                    label: 'Manual Number',
                    phone,
                    message: templateMessage,
                    chars: stats.chars,
                    units: stats.units,
                    cost: stats.units * smsRate,
                };
            }
            const joinedStudentNames = recList.map(r => r.student_name).join(' & ');
            const primaryRec = recList[0];
            const customRec: SelectedRecipient = { ...primaryRec, student_name: joinedStudentNames };
            const rendered = renderTemplateMessage(templateMessage, customRec);
            const stats = smsUnits(rendered);
            return {
                label: primaryRec.parent_name ? `${joinedStudentNames} (${primaryRec.parent_name})` : joinedStudentNames,
                phone,
                message: rendered,
                chars: stats.chars,
                units: stats.units,
                cost: stats.units * smsRate,
            };
        });
    } else {
        previewItems = recipients.map(r => {
            const isManual = r.student_id < 0;
            const rendered = isManual ? templateMessage : renderTemplateMessage(templateMessage, r);
            const stats = smsUnits(rendered);
            return {
                label: isManual ? 'Manual Number' : (r.parent_name ? `${r.student_name} (${r.parent_name})` : r.student_name),
                phone: r.phone,
                message: rendered,
                chars: stats.chars,
                units: stats.units,
                cost: stats.units * smsRate,
            };
        });
    }

    const filtered = previewItems.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) || item.phone.includes(search) || item.message.toLowerCase().includes(search.toLowerCase())
    );

    const totalUnits = previewItems.reduce((acc, item) => acc + item.units, 0);
    const totalCost = (totalUnits * smsRate).toFixed(2);

    return createPortal(
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-default flex items-center justify-between bg-page-subtle">
                    <div className="flex items-center gap-2.5">
                        <Eye className="w-5 h-5 text-primary" />
                        <div>
                            <h3 className="font-bold text-heading text-base">SMS Messages Preview</h3>
                            <p className="text-xs text-body-muted">Exact rendered messages per recipient</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-body-muted hover:text-heading hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Summary Bar */}
                <div className="p-4 border-b border-default bg-card flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter preview…"
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-default bg-input text-xs text-heading outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                        <span className="bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg text-body">
                            {previewItems.length} Messages
                        </span>
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                            Total: ৳ {totalCost} ({totalUnits} SMS units)
                        </span>
                    </div>
                </div>

                {/* Preview Cards List */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[50vh]">
                    {filtered.length === 0 ? (
                        <p className="text-center text-body-muted text-sm py-8">No matching previews found</p>
                    ) : (
                        filtered.map((item, idx) => (
                            <div key={idx} className="border border-default rounded-2xl p-4 bg-page-subtle/50 space-y-2">
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-default/60">
                                    <span className="font-bold text-heading flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-primary" />
                                        {item.label}
                                    </span>
                                    <span className="font-mono text-body-muted">{item.phone}</span>
                                </div>
                                <p className="text-sm text-body whitespace-pre-wrap leading-relaxed font-sans bg-input p-3 rounded-xl border border-default">
                                    {item.message || <span className="text-body-muted italic">(Empty message)</span>}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-body-muted pt-1">
                                    <span>{item.chars} chars · {item.units} SMS unit{item.units !== 1 ? 's' : ''}</span>
                                    <span className="font-bold text-primary">৳ {item.cost.toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-default bg-page-subtle flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-heading text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Compose Tab ─────────────────────────────────────────────────────────────

function ComposeTab() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [recipients, setRecipients] = useState<SelectedRecipient[]>([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [selectorMode, setSelectorMode] = useState<'course' | 'individual' | 'manual'>('course');
    const [individualSearch, setIndividualSearch] = useState('');
    const [groupPerParent, setGroupPerParent] = useState(true);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [smsRate, setSmsRate] = useState<number>(0.40);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Manual phone entry state
    const [manualInput, setManualInput] = useState('');
    const [manualError, setManualError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [recRes, settingsRes] = await Promise.all([
                    api.get('/common/sms/recipient_options/'),
                    api.get('/common/settings/get_settings/'),
                ]);
                setCourses(recRes.data.courses || []);
                if (settingsRes.data.settings?.sms_rate != null) {
                    setSmsRate(Number(settingsRes.data.settings.sms_rate));
                }
            } catch (e) { console.error(e); }
            finally { setLoadingCourses(false); }
        })();
    }, []);

    // Check if recipient selected by student_id
    const isSelected = (student_id: number) => recipients.some(r => r.student_id === student_id);

    // Manual phone helpers
    const normalizePhone = (raw: string): string => {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('880') && digits.length === 13) return '0' + digits.slice(3);
        if (digits.startsWith('88') && digits.length === 12) return '0' + digits.slice(2);
        return digits.startsWith('0') ? digits : digits;
    };
    const isValidBDPhone = (p: string) => /^01[2-9]\d{8}$/.test(p);
    const isManualRecipient = (r: SelectedRecipient) => r.student_id < 0;

    const addManualPhone = () => {
        setManualError('');
        // Support comma/space separated batch entry
        const raw = manualInput.trim();
        if (!raw) return;
        const entries = raw.split(/[,\s]+/).map(normalizePhone).filter(Boolean);
        const invalid = entries.filter(p => !isValidBDPhone(p));
        if (invalid.length > 0) {
            setManualError(`Invalid: ${invalid.join(', ')} — must be 11-digit BD number starting with 01`);
            return;
        }
        const alreadyExists = entries.filter(p => recipients.some(r => r.phone === p));
        const toAdd = entries.filter(p => !recipients.some(r => r.phone === p));
        if (toAdd.length === 0 && alreadyExists.length > 0) {
            setManualError(`Already added: ${alreadyExists.join(', ')}`);
            return;
        }
        const manualItems: SelectedRecipient[] = toAdd.map((p, i) => ({
            student_id: -(Date.now() + i),  // negative sentinel for manual entries
            student_name: 'Manual',
            parent_name: '',
            phone: p,
            course_name: '',
            batch_name: '',
        }));
        setRecipients(prev => [...prev, ...manualItems]);
        setManualInput('');
        if (alreadyExists.length > 0) {
            setManualError(`Added ${toAdd.length}. Already present: ${alreadyExists.join(', ')}`);
        }
    };

    const removeManualPhone = (phone: string) => {
        setRecipients(prev => prev.filter(r => r.phone !== phone || !isManualRecipient(r)));
    };

    const toggleRecipient = (student: RecipientStudent, course_name?: string, batch_name?: string) => {
        setRecipients(prev => {
            if (prev.some(r => r.student_id === student.student_id)) {
                return prev.filter(r => r.student_id !== student.student_id);
            }
            return [...prev, {
                student_id: student.student_id,
                student_name: student.student_name,
                parent_name: student.parent_name,
                phone: student.phone,
                course_name,
                batch_name,
            }];
        });
    };

    const toggleBatchStudents = (batch: Batch, course_name?: string) => {
        const batchStudentIds = batch.students.map(s => s.student_id);
        const allInBatchSelected = batchStudentIds.length > 0 && batchStudentIds.every(id => isSelected(id));

        if (allInBatchSelected) {
            setRecipients(prev => prev.filter(r => !batchStudentIds.includes(r.student_id)));
        } else {
            setRecipients(prev => {
                const updated = [...prev];
                batch.students.forEach(s => {
                    if (!updated.some(r => r.student_id === s.student_id)) {
                        updated.push({
                            student_id: s.student_id,
                            student_name: s.student_name,
                            parent_name: s.parent_name,
                            phone: s.phone,
                            course_name,
                            batch_name: batch.name,
                        });
                    }
                });
                return updated;
            });
        }
    };

    const toggleCourseStudents = (course: Course) => {
        const courseStudents = course.batches.flatMap(b => b.students);
        const allInCourseSelected = courseStudents.length > 0 && courseStudents.every(s => isSelected(s.student_id));

        if (allInCourseSelected) {
            const courseStudentIds = courseStudents.map(s => s.student_id);
            setRecipients(prev => prev.filter(r => !courseStudentIds.includes(r.student_id)));
        } else {
            setRecipients(prev => {
                const updated = [...prev];
                course.batches.forEach(b => {
                    b.students.forEach(s => {
                        if (!updated.some(r => r.student_id === s.student_id)) {
                            updated.push({
                                student_id: s.student_id,
                                student_name: s.student_name,
                                parent_name: s.parent_name,
                                phone: s.phone,
                                course_name: course.name,
                                batch_name: b.name,
                            });
                        }
                    });
                });
                return updated;
            });
        }
    };

    const getBatchState = (batch: Batch): 'all' | 'some' | 'none' => {
        if (batch.students.length === 0) return 'none';
        const selectedCount = batch.students.filter(s => isSelected(s.student_id)).length;
        if (selectedCount === batch.students.length) return 'all';
        if (selectedCount > 0) return 'some';
        return 'none';
    };

    const getCourseState = (course: Course): 'all' | 'some' | 'none' => {
        const allStudents = course.batches.flatMap(b => b.students);
        if (allStudents.length === 0) return 'none';
        const selectedCount = allStudents.filter(s => isSelected(s.student_id)).length;
        if (selectedCount === allStudents.length) return 'all';
        if (selectedCount > 0) return 'some';
        return 'none';
    };

    // Check if multiple selected students share the same parent phone number
    const phoneCounts: Record<string, number> = {};
    recipients.forEach(r => {
        phoneCounts[r.phone] = (phoneCounts[r.phone] || 0) + 1;
    });
    const hasSharedParentPhones = Object.values(phoneCounts).some(c => c > 1);

    // Calculate SMS units & costs
    const { chars, units, isBangla, isUnicode } = smsUnits(message);

    // Calculate actual SMS units if placeholders are used
    const containsPlaceholders = /\{\{(STUDENT_NAME|PARENT_NAME|BATCH_NAME|COURSE_NAME)\}\}/.test(message);

    let effectiveSMSCount = 0;
    if (groupPerParent && hasSharedParentPhones) {
        const grouped: Record<string, SelectedRecipient[]> = {};
        recipients.forEach(r => {
            if (!grouped[r.phone]) grouped[r.phone] = [];
            grouped[r.phone].push(r);
        });

        effectiveSMSCount = Object.values(grouped).reduce((acc, recList) => {
            const joinedNames = recList.map(r => r.student_name).join(' & ');
            const rendered = renderTemplateMessage(message, { ...recList[0], student_name: joinedNames });
            return acc + smsUnits(rendered).units;
        }, 0);
    } else if (containsPlaceholders) {
        effectiveSMSCount = recipients.reduce((acc, r) => {
            const rendered = renderTemplateMessage(message, r);
            return acc + smsUnits(rendered).units;
        }, 0);
    } else {
        effectiveSMSCount = units * recipients.length;
    }

    const totalCost = (effectiveSMSCount * smsRate).toFixed(2);

    const insertPlaceholder = (tag: string) => {
        if (!textareaRef.current) {
            setMessage(prev => prev + tag);
            return;
        }
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const updated = message.substring(0, start) + tag + message.substring(end);
        setMessage(updated);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = start + tag.length;
                textareaRef.current.selectionEnd = start + tag.length;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const allFilteredStudents = courses.flatMap(c => c.batches.flatMap(b => ({ ...b, students: b.students, course_name: c.name, batch_name: b.name }))).flatMap(b =>
        b.students.map(s => ({ ...s, course_name: b.course_name, batch_name: b.batch_name }))
    ).filter(s =>
        individualSearch ? (
            s.student_name.toLowerCase().includes(individualSearch.toLowerCase()) ||
            s.parent_name.toLowerCase().includes(individualSearch.toLowerCase()) ||
            s.phone.includes(individualSearch)
        ) : true
    );

    const handleSend = async () => {
        if (!message.trim() || recipients.length === 0) return;
        setSending(true);
        setResult(null);
        let isSuccess = false;
        try {
            const studentRecipients = recipients.filter(r => !isManualRecipient(r));
            const manualRecipients = recipients.filter(isManualRecipient);
            const manualPhones = manualRecipients.map(r => r.phone);

            if (groupPerParent && hasSharedParentPhones && studentRecipients.length > 0) {
                // Group student recipients by phone, render per-phone message
                const grouped: Record<string, SelectedRecipient[]> = {};
                studentRecipients.forEach(r => {
                    if (!grouped[r.phone]) grouped[r.phone] = [];
                    grouped[r.phone].push(r);
                });

                const phoneNumbers: string[] = [];
                const renderedMessages: { phone: string; label: string; message: string }[] = [];
                Object.entries(grouped).forEach(([phone, recList]) => {
                    const joinedNames = recList.map(r => r.student_name).join(' & ');
                    const rendered = renderTemplateMessage(message, { ...recList[0], student_name: joinedNames });
                    phoneNumbers.push(phone);
                    renderedMessages.push({ phone, label: `${joinedNames} (${recList[0].parent_name})`, message: rendered });
                });
                // Add manual phones (no template rendering)
                manualPhones.forEach(phone => {
                    phoneNumbers.push(phone);
                    renderedMessages.push({ phone, label: 'Manual', message });
                });

                const res = await api.post('/common/sms/send_bulk/', {
                    phone_numbers: phoneNumbers,
                    message: message,
                    rendered_messages: renderedMessages,
                });
                isSuccess = res.data.success;
                setResult({ success: res.data.success, message: res.data.message });
            } else if (containsPlaceholders && studentRecipients.length > 0) {
                // Render per-student messages; manual phones get message as-is
                const renderedMessages: { phone: string; label: string; message: string }[] = [
                    ...studentRecipients.map(r => ({
                        phone: r.phone,
                        label: `${r.student_name} (${r.parent_name})`,
                        message: renderTemplateMessage(message, r),
                    })),
                    ...manualRecipients.map(r => ({ phone: r.phone, label: 'Manual', message })),
                ];
                const allPhones = Array.from(new Set([
                    ...studentRecipients.map(r => r.phone),
                    ...manualPhones,
                ]));
                const res = await api.post('/common/sms/send_bulk/', {
                    phone_numbers: allPhones,
                    message: message,
                    rendered_messages: renderedMessages,
                });
                isSuccess = res.data.success;
                setResult({ success: res.data.success, message: res.data.message });
            } else {
                // No template placeholders — same message to all
                const phones = Array.from(new Set(recipients.map(r => r.phone)));
                const endpoint = phones.length === 1 ? '/common/sms/send_single/' : '/common/sms/send_bulk/';
                const payload = phones.length === 1
                    ? { phone_number: phones[0], message }
                    : { phone_numbers: phones, message };
                const res = await api.post(endpoint, payload);
                isSuccess = res.data.success;
                setResult({ success: res.data.success, message: res.data.message });
            }

            if (isSuccess) {
                setMessage('');
                setRecipients([]);
            }
        } catch (e: any) {
            setResult({ success: false, message: e.response?.data?.message || 'Failed to send SMS' });
        } finally {
            setSending(false);
        }
    };

    const selectorOptions = [
        { key: 'course', label: 'By Course / Batch' },
        { key: 'individual', label: 'Individual' },
        { key: 'manual', label: 'Manual Numbers' },
    ] as const;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMS Preview Modal */}
            <SMSPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                recipients={recipients}
                templateMessage={message}
                groupPerParent={groupPerParent && hasSharedParentPhones}
                smsRate={smsRate}
            />

            {/* Recipient Selector */}
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-default space-y-3">
                    <h3 className="font-semibold text-heading text-base">Select Recipients</h3>
                    <SlidingSwitch
                        options={[...selectorOptions]}
                        value={selectorMode}
                        onChange={setSelectorMode}
                    />
                </div>

                <div className="p-4 max-h-[520px] overflow-y-auto flex-1">
                    {selectorMode === 'course' ? (
                        loadingCourses ? (
                            <div className="text-center text-body-muted text-sm py-12">Loading recipient options…</div>
                        ) : (
                            <div className="space-y-4">
                                {courses.map(course => {
                                    const courseState = getCourseState(course);
                                    const totalStudents = course.batches.reduce((acc, b) => acc + b.students.length, 0);

                                    return (
                                        <div key={course.id} className="border border-default/70 rounded-xl p-3 bg-page-subtle/40 space-y-2">
                                            {/* Course Row Header */}
                                            <div className="flex items-center justify-between pb-2 border-b border-default/50">
                                                <div className="flex items-center gap-2.5">
                                                    <TriStateCheckbox
                                                        state={courseState}
                                                        onClick={() => toggleCourseStudents(course)}
                                                    />
                                                    <BookOpen className="w-4 h-4 text-secondary shrink-0" />
                                                    <span className="font-bold text-sm text-heading">{course.name}</span>
                                                    <span className="text-xs text-body-muted font-normal">({totalStudents} students)</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCourseStudents(course)}
                                                    className="text-xs font-semibold text-primary hover:underline"
                                                >
                                                    {courseState === 'all' ? 'Deselect All in Course' : 'Select All in Course'}
                                                </button>
                                            </div>

                                            {/* Batches Tree */}
                                            <div className="pl-4 space-y-3 pt-1">
                                                {course.batches.map(batch => {
                                                    const batchState = getBatchState(batch);

                                                    return (
                                                        <div key={batch.id} className="space-y-1.5">
                                                            {/* Batch Header */}
                                                            <div className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <TriStateCheckbox
                                                                        state={batchState}
                                                                        onClick={() => toggleBatchStudents(batch, course.name)}
                                                                    />
                                                                    <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                                                                    <span className="font-semibold text-sm text-heading">{batch.name}</span>
                                                                    <span className="text-xs text-body-muted font-normal">({batch.students.length})</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleBatchStudents(batch, course.name)}
                                                                    className="text-xs font-semibold text-primary hover:underline"
                                                                >
                                                                    {batchState === 'all' ? 'Deselect All in Batch' : 'Select All in Batch'}
                                                                </button>
                                                            </div>

                                                            {/* Students List */}
                                                            <div className="pl-6 space-y-1 border-l-2 border-neutral-200 dark:border-neutral-800 ml-3">
                                                                {batch.students.map(s => {
                                                                    const studentSelected = isSelected(s.student_id);
                                                                    return (
                                                                        <div
                                                                            key={s.student_id}
                                                                            onClick={() => toggleRecipient(s, course.name, batch.name)}
                                                                            className={cn(
                                                                                'flex items-center justify-between py-1.5 px-2.5 rounded-lg text-sm transition-colors cursor-pointer select-none',
                                                                                studentSelected
                                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 font-medium'
                                                                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <TriStateCheckbox
                                                                                    state={studentSelected ? 'all' : 'none'}
                                                                                />
                                                                                <span className="font-medium text-heading truncate">{s.student_name}</span>
                                                                                <span className="text-xs text-body-muted truncate">({s.parent_name} · {s.phone})</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : selectorMode === 'individual' ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                                <input
                                    value={individualSearch}
                                    onChange={e => setIndividualSearch(e.target.value)}
                                    placeholder="Search student by name, parent or phone…"
                                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                                {allFilteredStudents.slice(0, 80).map(s => {
                                    const studentSelected = isSelected(s.student_id);
                                    return (
                                        <div
                                            key={s.student_id}
                                            onClick={() => toggleRecipient(s, s.course_name, s.batch_name)}
                                            className={cn(
                                                'flex items-center justify-between p-2.5 rounded-xl text-sm transition-colors cursor-pointer select-none',
                                                studentSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700'
                                                    : 'hover:bg-page-subtle'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <TriStateCheckbox state={studentSelected ? 'all' : 'none'} />
                                                <div>
                                                    <p className="font-semibold text-heading text-sm">{s.student_name}</p>
                                                    <p className="text-xs text-body-muted">{s.parent_name} · <span className="font-mono">{s.phone}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {allFilteredStudents.length === 0 && (
                                    <p className="text-center text-body-muted text-sm py-8">No students found matching search</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Manual number entry */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-heading block">Enter Phone Number(s)</label>
                                <div className="flex gap-2">
                                    <input
                                        value={manualInput}
                                        onChange={e => { setManualInput(e.target.value); setManualError(''); }}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualPhone(); } }}
                                        placeholder="01XXXXXXXXX (comma-separate multiple)"
                                        className="flex-1 h-11 px-4 rounded-xl border border-default bg-input text-sm font-mono text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={addManualPhone}
                                        disabled={!manualInput.trim()}
                                        className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    >
                                        Add
                                    </button>
                                </div>
                                {manualError && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                                        {manualError}
                                    </p>
                                )}
                                <p className="text-xs text-body-muted">Bangladeshi 11-digit numbers only (01XXXXXXXXX). Paste multiple numbers separated by commas or spaces.</p>
                            </div>

                            {/* Added manual numbers */}
                            {recipients.filter(isManualRecipient).length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-xs font-semibold text-body-muted uppercase tracking-wide">
                                        Added Manual Numbers ({recipients.filter(isManualRecipient).length})
                                    </span>
                                    <div className="flex flex-wrap gap-2 p-3 bg-page-subtle rounded-2xl border border-default">
                                        {recipients.filter(isManualRecipient).map(r => (
                                            <button
                                                key={r.phone}
                                                type="button"
                                                onClick={() => removeManualPhone(r.phone)}
                                                title="Click to remove"
                                                className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500 hover:text-white text-heading text-xs font-mono font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer border border-default hover:border-red-500 group"
                                            >
                                                {r.phone}
                                                <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {recipients.filter(isManualRecipient).length === 0 && (
                                <div className="text-center py-10 border border-dashed border-default rounded-2xl">
                                    <div className="text-3xl mb-2">📱</div>
                                    <p className="text-sm text-body-muted">No manual numbers added yet.<br />Enter a phone number above and click Add.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Composer */}
            <div className="space-y-4">
                {/* Selected Recipients */}
                <div className="bg-card rounded-2xl border border-default shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-heading text-base">Selected Recipients <span className="text-primary font-bold">({recipients.length})</span></h3>
                        {recipients.length > 0 && (
                            <button
                                onClick={() => setRecipients([])}
                                className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Parent SMS Grouping Toggle (Shows only when multiple students share parent phone) */}
                    {hasSharedParentPhones && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                    <Users className="w-4 h-4" /> Multiple students share parent phone numbers
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <SlidingSwitch
                                    options={[
                                        { key: 'group', label: '1 SMS per Parent' },
                                        { key: 'separate', label: 'Separate SMS per Student' },
                                    ]}
                                    value={groupPerParent ? 'group' : 'separate'}
                                    onChange={val => setGroupPerParent(val === 'group')}
                                    className="w-full text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {recipients.length === 0 ? (
                        <p className="text-body-muted text-sm text-center py-6 border border-dashed border-default rounded-xl">No recipients selected yet. Check items on the left to add recipients.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                            {recipients.map(r =>
                                isManualRecipient(r) ? (
                                    <button
                                        key={r.student_id}
                                        onClick={() => removeManualPhone(r.phone)}
                                        title="Click to remove (manual number)"
                                        className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500 hover:text-white text-heading text-xs font-mono font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer border border-default hover:border-red-500 group shadow-xs"
                                    >
                                        <span>{r.phone}</span>
                                        <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        key={r.student_id}
                                        onClick={() => toggleRecipient(r)}
                                        title="Click to remove"
                                        className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-red-500 hover:text-white text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer border border-primary/20 hover:border-red-500 group shadow-xs"
                                    >
                                        <span>{r.student_name} ({r.parent_name})</span>
                                        <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Message Composer Box */}
                <div className="bg-card rounded-2xl border border-default shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-heading text-base">Message Body</h3>
                        {recipients.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(true)}
                                className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <Eye className="w-3.5 h-3.5" /> Preview Rendered SMS
                            </button>
                        )}
                    </div>

                    {/* BTRC Regulation Requirement Notice */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="font-bold text-amber-900 dark:text-amber-200">BTRC SMS Regulation Requirement</p>
                            <p className="leading-relaxed">
                                Under BTRC regulations, all bulk, promotional, notification, and transactional SMS <strong>must be sent in Bangla</strong>. Purely English text for general campaigns is restricted, though specific elements like OTPs, URLs, numbers, and brand names can remain in English within a Bangla template.
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Template Tags Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pb-1">
                        <span className="text-xs font-semibold text-body-muted flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-primary" /> Insert Tag:
                        </span>
                        {[
                            { label: '{{STUDENT_NAME}}', tag: '{{STUDENT_NAME}}' },
                            { label: '{{PARENT_NAME}}', tag: '{{PARENT_NAME}}' },
                            { label: '{{COURSE_NAME}}', tag: '{{COURSE_NAME}}' },
                            { label: '{{BATCH_NAME}}', tag: '{{BATCH_NAME}}' },
                        ].map(t => (
                            <button
                                key={t.tag}
                                type="button"
                                onClick={() => insertPlaceholder(t.tag)}
                                className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-primary/20 hover:text-primary text-[11px] font-mono font-semibold transition-colors text-heading border border-default"
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type SMS in Bangla… (e.g., প্রিয় {{STUDENT_NAME}}, আপনার ক্লাস সময় পরিবর্তিত হয়েছে।)"
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-default bg-input text-sm text-heading focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none leading-relaxed"
                    />

                    {/* Character, Unit & Cost Counter Bar */}
                    <div className="pt-2 border-t border-default space-y-2">
                        <div className="flex flex-wrap items-center justify-between text-xs text-body-muted gap-2">
                            <span>
                                {chars} chars · {isBangla ? 'Bangla (70 chars/SMS)' : isUnicode ? 'Unicode (70 chars/SMS)' : 'GSM-7 (160 chars/SMS)'}
                            </span>
                            <span className={cn('font-semibold', units > 3 ? 'text-red-500' : units > 1 ? 'text-amber-500' : 'text-body-muted')}>
                                {effectiveSMSCount} total SMS message{effectiveSMSCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="flex justify-end text-xs text-body-muted">
                            <span>
                                Total Estimated Cost: <span className="font-bold text-heading">৳ {totalCost}</span> <span className="text-[11px] text-body-muted">({smsRate.toFixed(2)} Tk/SMS)</span>
                            </span>
                        </div>
                    </div>

                    {result && (
                        <div className={cn('p-3.5 rounded-xl text-sm flex items-center gap-2 border font-medium', result.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400')}>
                            {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                            {result.message}
                        </div>
                    )}

                    <button
                        onClick={handleSend}
                        disabled={sending || !message.trim() || recipients.length === 0}
                        className={cn(
                            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm',
                            message.trim() && recipients.length > 0
                                ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer shadow-md'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                        )}
                    >
                        {sending ? <><RefreshCw className="w-4 h-4 animate-spin" />Sending SMS…</> : <><Send className="w-4 h-4" />Send ({effectiveSMSCount} SMS · ৳ {totalCost})</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SMSManagementPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'compose'>('logs');
    const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);

    const tabs = [
        { key: 'logs', label: 'SMS Logs', icon: <MessageSquare className="w-4 h-4 shrink-0" /> },
        { key: 'compose', label: 'Compose', icon: <Send className="w-4 h-4 shrink-0" /> },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Log Detail Modal — rendered at top level to avoid scroll container stacking context */}
            <SMSLogDetailModal
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
            />

            {/* Main Tab Bar with Sliding Switch */}
            <div className="flex justify-start">
                <SlidingSwitch
                    options={[...tabs]}
                    value={activeTab}
                    onChange={setActiveTab}
                    className="w-full sm:w-auto"
                />
            </div>

            {activeTab === 'logs' && <SMSLogsTab selectedLog={selectedLog} setSelectedLog={setSelectedLog} />}
            {activeTab === 'compose' && <ComposeTab />}
        </div>
    );
}
