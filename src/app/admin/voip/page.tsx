'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Phone, PhoneCall, PhoneOff, PhoneMissed, RefreshCw, Search,
    CheckCircle2, XCircle, AlertCircle, Clock, Radio, Ban,
    ChevronDown, ChevronUp, Users, Activity, Pause, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface VoiceCallLog {
    id: number;
    phone_number: string;
    parent_name: string | null;
    campaign: number | null;
    campaign_type: string | null;
    broadcast_id: string | null;
    broadcast_name: string;
    call_type: string;
    call_type_display: string;
    call_status: string;
    call_status_display: string;
    call_duration: number | null;
    attempt_number: number;
    result_fetched: boolean;
    sent_by_name: string;
    initiated_at: string;
    completed_at: string | null;
}

interface Campaign {
    id: number;
    parent_name: string | null;
    parent_phone: string | null;
    month_display: string | null;
    campaign_type: string;
    campaign_type_display: string;
    call_answered: boolean;
    is_active: boolean;
    total_calls_made: number;
    created_at: string;
    updated_at: string;
}

interface DashboardStats {
    total_calls: number;
    today_calls: number;
    answered_today: number;
    not_answered_today: number;
    active_campaigns: number;
    by_status: {
        answered: number;
        not_answered: number;
        broadcasting: number;
        failed: number;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dt: string) {
    return new Date(dt).toLocaleString('en-BD', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatDuration(secs: number | null) {
    if (secs === null) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const CALL_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    ANSWERED: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <PhoneCall className="w-3.5 h-3.5" />, label: 'Answered' },
    NOT_ANSWERED: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: <PhoneMissed className="w-3.5 h-3.5" />, label: 'Not Answered' },
    BROADCASTING: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', icon: <Radio className="w-3.5 h-3.5" />, label: 'Broadcasting' },
    PENDING: { color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending' },
    REJECTED: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', icon: <PhoneOff className="w-3.5 h-3.5" />, label: 'Rejected' },
    BUSY: { color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400', icon: <Phone className="w-3.5 h-3.5" />, label: 'Busy' },
    FAILED: { color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Failed' },
    DISABLED: { color: 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800', icon: <Ban className="w-3.5 h-3.5" />, label: 'Disabled' },
};

const CALL_TYPE_COLOR: Record<string, string> = {
    INITIAL_5TH: 'text-primary bg-primary-50 dark:bg-primary-900/20',
    INITIAL_10TH: 'text-secondary bg-secondary-50 dark:bg-secondary-900/20',
    FOLLOWUP_5TH: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
    FOLLOWUP_10TH: 'text-tangerine-600 bg-tangerine-50 dark:bg-tangerine-900/20',
    MANUAL: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
};

// ─── Stats Cards ─────────────────────────────────────────────────────────────

function VoIPStatsCards({ stats }: { stats: DashboardStats | null }) {
    const cards = [
        { label: "Today's Calls", value: stats?.today_calls ?? '—', icon: <Phone className="w-5 h-5" />, color: 'text-primary' },
        { label: 'Answered Today', value: stats?.answered_today ?? '—', icon: <PhoneCall className="w-5 h-5" />, color: 'text-emerald-500' },
        { label: 'Not Answered', value: stats?.not_answered_today ?? '—', icon: <PhoneMissed className="w-5 h-5" />, color: 'text-amber-500' },
        { label: 'Active Campaigns', value: stats?.active_campaigns ?? '—', icon: <Activity className="w-5 h-5" />, color: 'text-secondary' },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map(c => (
                <div key={c.label} className="bg-card rounded-2xl border border-default p-4 shadow-sm">
                    <div className={cn('mb-2', c.color)}>{c.icon}</div>
                    <p className="text-2xl font-bold text-heading">{c.value}</p>
                    <p className="text-xs text-body-muted mt-0.5">{c.label}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Call Logs Tab ────────────────────────────────────────────────────────────

function CallLogsTab() {
    const [logs, setLogs] = useState<VoiceCallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), page_size: String(pageSize) };
            if (search) params.search = search;
            if (typeFilter) params.call_type = typeFilter;
            if (statusFilter) params.call_status = statusFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const res = await api.get('/common/voip/calls/', { params });
            setLogs(res.data.results || res.data);
            setTotal(res.data.count || (res.data.results || res.data).length);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, search, typeFilter, statusFilter, startDate, endDate]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-default p-4 shadow-sm">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <label className="text-xs font-medium text-body-muted mb-1 block">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Phone number…" className="input-field pl-9 text-sm" />
                        </div>
                    </div>
                    <div className="min-w-40">
                        <label className="text-xs font-medium text-body-muted mb-1 block">Type</label>
                        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="input-field text-sm">
                            <option value="">All Types</option>
                            <option value="INITIAL_5TH">Initial (5th)</option>
                            <option value="INITIAL_10TH">Initial (10th)</option>
                            <option value="FOLLOWUP_5TH">Follow-up (5th)</option>
                            <option value="FOLLOWUP_10TH">Follow-up (10th)</option>
                            <option value="MANUAL">Manual</option>
                        </select>
                    </div>
                    <div className="min-w-36">
                        <label className="text-xs font-medium text-body-muted mb-1 block">Status</label>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field text-sm">
                            <option value="">All Statuses</option>
                            <option value="ANSWERED">Answered</option>
                            <option value="NOT_ANSWERED">Not Answered</option>
                            <option value="BROADCASTING">Broadcasting</option>
                            <option value="FAILED">Failed</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="BUSY">Busy</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-body-muted mb-1 block">From</label>
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input-field text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-body-muted mb-1 block">To</label>
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input-field text-sm" />
                    </div>
                    <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4" />Refresh
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                <div className="p-4 border-b border-default flex items-center justify-between">
                    <h3 className="font-semibold text-heading">Call Logs</h3>
                    <span className="text-xs text-body-muted">{total} records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-default bg-page-subtle">
                                {['Time', 'Parent', 'Phone', 'Type', 'Attempt', 'Status', 'Duration', 'Broadcast ID', 'By'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-default">
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-body-muted">
                                        <Phone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        No call logs found
                                    </td>
                                </tr>
                            ) : logs.map(log => {
                                const sc = CALL_STATUS_CONFIG[log.call_status] || CALL_STATUS_CONFIG.PENDING;
                                return (
                                    <tr key={log.id} className="border-b border-default hover:bg-page-subtle transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-body-muted">{formatDate(log.initiated_at)}</td>
                                        <td className="px-4 py-3 text-xs text-body whitespace-nowrap">{log.parent_name || '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-body whitespace-nowrap">{log.phone_number}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CALL_TYPE_COLOR[log.call_type] || 'text-body-muted bg-neutral-100')}>{log.call_type_display}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-body">#{log.attempt_number}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', sc.color)}>
                                                {sc.icon}{sc.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-body whitespace-nowrap">{formatDuration(log.call_duration)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-body-muted">{log.broadcast_id || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-body whitespace-nowrap">{log.sent_by_name}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-default flex items-center justify-between">
                        <span className="text-xs text-body-muted">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/common/voip/campaigns/');
            setCampaigns(res.data.results || res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const deactivate = async (id: number) => {
        setActionLoading(id);
        try {
            await api.post(`/common/voip/campaigns/${id}/deactivate/`);
            fetchCampaigns();
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const markAnswered = async (id: number) => {
        setActionLoading(id);
        try {
            await api.post(`/common/voip/campaigns/${id}/mark_answered/`);
            fetchCampaigns();
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    return (
        <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
            <div className="p-4 border-b border-default flex items-center justify-between">
                <h3 className="font-semibold text-heading">Payment Call Campaigns</h3>
                <button onClick={fetchCampaigns} className="btn-secondary text-xs flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />Refresh
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-default bg-page-subtle">
                            {['Parent', 'Phone', 'Month', 'Campaign', 'Calls Made', 'Answered', 'Active', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-default">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-body-muted">
                                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    No campaigns found
                                </td>
                            </tr>
                        ) : campaigns.map(c => (
                            <tr key={c.id} className={cn('border-b border-default hover:bg-page-subtle transition-colors', !c.is_active && 'opacity-60')}>
                                <td className="px-4 py-3 text-sm text-heading font-medium whitespace-nowrap">{c.parent_name || '—'}</td>
                                <td className="px-4 py-3 font-mono text-xs text-body">{c.parent_phone || '—'}</td>
                                <td className="px-4 py-3 text-xs text-body whitespace-nowrap">{c.month_display}</td>
                                <td className="px-4 py-3">
                                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                                        c.campaign_type === 'FIFTH_DAY' ? 'text-primary bg-primary-50 dark:bg-primary-900/20' : 'text-secondary bg-secondary-50 dark:bg-secondary-900/20')}>
                                        {c.campaign_type_display}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-semibold text-heading">{c.total_calls_made}</td>
                                <td className="px-4 py-3 text-center">
                                    {c.call_answered
                                        ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
                                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium"><PhoneMissed className="w-3.5 h-3.5" />No</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {c.is_active
                                        ? <span className="text-xs text-emerald-600 font-medium">Active</span>
                                        : <span className="text-xs text-body-muted">Stopped</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {!c.call_answered && c.is_active && (
                                            <button onClick={() => markAnswered(c.id)} disabled={actionLoading === c.id}
                                                className="text-xs text-emerald-600 hover:underline font-medium disabled:opacity-50">
                                                Mark Answered
                                            </button>
                                        )}
                                        {c.is_active && (
                                            <button onClick={() => deactivate(c.id)} disabled={actionLoading === c.id}
                                                className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50">
                                                Stop
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Manual Call Tab ──────────────────────────────────────────────────────────

function ManualCallTab() {
    const [phone, setPhone] = useState('');
    const [calling, setCalling] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; broadcast_id?: number } | null>(null);
    const [fetchingResults, setFetchingResults] = useState(false);

    const handleCall = async () => {
        if (!phone.trim()) return;
        setCalling(true);
        setResult(null);
        try {
            const res = await api.post('/common/voip/calls/make_call/', { phone_number: phone });
            setResult({ success: res.data.success, message: res.data.message, broadcast_id: res.data.broadcast_id });
            if (res.data.success) setPhone('');
        } catch (e: any) {
            setResult({ success: false, message: e.response?.data?.message || 'Call failed' });
        } finally { setCalling(false); }
    };

    const triggerFetchResults = async () => {
        setFetchingResults(true);
        try {
            await api.post('/common/voip/calls/trigger_fetch_results/');
            alert('Result fetching task queued successfully!');
        } catch (e) { console.error(e); }
        finally { setFetchingResults(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-heading">Manual Call</h3>
                        <p className="text-xs text-body-muted">Trigger a single VoIP call to any number</p>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted" />
                        <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="input-field pl-9 font-mono"
                        />
                    </div>
                </div>

                {result && (
                    <div className={cn('p-3 rounded-xl text-sm flex items-center gap-2',
                        result.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400')}>
                        {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                        <div>
                            <p>{result.message}</p>
                            {result.broadcast_id && <p className="text-xs opacity-75 mt-0.5">Broadcast ID: {result.broadcast_id}</p>}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleCall}
                    disabled={calling || !phone.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {calling ? <><RefreshCw className="w-4 h-4 animate-spin" />Calling…</> : <><PhoneCall className="w-4 h-4" />Make Call</>}
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-heading">Fetch Call Results</h3>
                        <p className="text-xs text-body-muted">Manually poll AwajDigital for pending broadcast results</p>
                    </div>
                </div>
                <p className="text-sm text-body">
                    The system automatically polls for call results every 30 minutes. 
                    Use this to immediately update the status of any calls still showing as "Broadcasting".
                </p>
                <button onClick={triggerFetchResults} disabled={fetchingResults}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-50">
                    {fetchingResults ? <><RefreshCw className="w-4 h-4 animate-spin" />Fetching…</> : <><RefreshCw className="w-4 h-4" />Fetch Results Now</>}
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VoIPManagementPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'campaigns' | 'manual'>('logs');
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/common/voip/calls/dashboard_stats/');
                setStats(res.data);
            } catch (e) { console.error(e); }
        })();
    }, []);

    const tabs = [
        { key: 'logs', label: 'Call Logs', icon: <Phone className="w-4 h-4" /> },
        { key: 'campaigns', label: 'Campaigns', icon: <Activity className="w-4 h-4" /> },
        { key: 'manual', label: 'Manual Call', icon: <PhoneCall className="w-4 h-4" /> },
    ] as const;

    return (
        <div className="space-y-6">
            <VoIPStatsCards stats={stats} />

            <div className="flex gap-2 border-b border-default">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                            activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-body-muted hover:text-body')}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'logs' && <CallLogsTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
            {activeTab === 'manual' && <ManualCallTab />}
        </div>
    );
}
