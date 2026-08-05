'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings, MessageSquare, Phone, FileText, Clock, ToggleLeft,
    ToggleRight, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
    Eye, EyeOff, ChevronRight, Info, Save, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SystemSettings {
    id: number;
    // Invoice
    payment_reminder_days: string;
    invoice_generation_days: number;
    auto_generate_invoices: boolean;
    // SMS
    auto_send_reminders: boolean;
    sms_rate: number;
    payment_reminder_sms_template: string;
    // VoIP
    voip_enabled: boolean;
    awajdigital_voice_name: string;
    awajdigital_sender_number: string;
    voip_call_time_morning: string;
    voip_call_time_evening: string;
    voip_5th_day_enabled: boolean;
    voip_10th_day_enabled: boolean;
    updated_at: string;
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, description, disabled }: {
    value: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-heading">{label}</p>
                {description && <p className="text-xs text-body-muted mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!value)}
                disabled={disabled}
                className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
                    value ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'
                )}
            >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', value ? 'translate-x-6' : 'translate-x-1')} />
            </button>
        </div>
    );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, description, badge }: {
    icon: React.ReactNode; title: string; description: string; badge?: { label: string; color: string };
}) {
    return (
        <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-primary">
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-heading">{title}</h2>
                    {badge && <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badge.color)}>{badge.label}</span>}
                </div>
                <p className="text-xs text-body-muted mt-0.5">{description}</p>
            </div>
        </div>
    );
}

// ─── Masked Input ─────────────────────────────────────────────────────────────

function MaskedInput({ value, onChange, placeholder, label }: {
    value: string; onChange: (v: string) => void; placeholder?: string; label: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label className="text-sm font-medium text-body-muted mb-1.5 block">{label}</label>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="input-field pr-10 font-mono text-sm"
                />
                <button type="button" onClick={() => setVisible(!visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-body">
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Balance Cards ────────────────────────────────────────────────────────────

function BalanceSection() {
    const [smsBalance, setSmsBalance] = useState<string | null>(null);
    const [voipBalance, setVoipBalance] = useState<string | null>(null);
    const [smsLoading, setSmsLoading] = useState(false);
    const [voipLoading, setVoipLoading] = useState(false);

    const fetchSMSBalance = async () => {
        setSmsLoading(true);
        try {
            const res = await api.get('/common/sms/check_balance/');
            setSmsBalance(res.data.success ? String(res.data.balance) : `Error: ${res.data.message}`);
        } catch (e: any) { setSmsBalance('Error fetching balance'); }
        finally { setSmsLoading(false); }
    };

    const fetchVoIPBalance = async () => {
        setVoipLoading(true);
        try {
            const res = await api.get('/common/voip/calls/check_balance/');
            setVoipBalance(res.data.success ? `৳${res.data.balance}` : `Error: ${res.data.message}`);
        } catch (e: any) { setVoipBalance('Error fetching balance'); }
        finally { setVoipLoading(false); }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-default shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-heading">GreenWeb SMS Balance</span>
                    </div>
                    <button onClick={fetchSMSBalance} disabled={smsLoading}
                        className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5">
                        <RefreshCw className={cn('w-3.5 h-3.5', smsLoading && 'animate-spin')} />
                        {smsLoading ? 'Fetching…' : 'Refresh'}
                    </button>
                </div>
                <p className={cn('text-2xl font-bold', smsBalance ? 'text-heading' : 'text-body-muted')}>
                    {smsBalance || 'Click refresh to load'}
                </p>
            </div>
            <div className="bg-card rounded-2xl border border-default shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-heading">AwajDigital VoIP Balance</span>
                    </div>
                    <button onClick={fetchVoIPBalance} disabled={voipLoading}
                        className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5">
                        <RefreshCw className={cn('w-3.5 h-3.5', voipLoading && 'animate-spin')} />
                        {voipLoading ? 'Fetching…' : 'Refresh'}
                    </button>
                </div>
                <p className={cn('text-2xl font-bold', voipBalance ? 'text-heading' : 'text-body-muted')}>
                    {voipBalance || 'Click refresh to load'}
                </p>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [draft, setDraft] = useState<Partial<SystemSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
    const [smsPreview, setSmsPreview] = useState('');
    const [voices, setVoices] = useState<string[]>([]);
    const [senders, setSenders] = useState<string[]>([]);
    const [fetchingVoices, setFetchingVoices] = useState(false);
    const [fetchingSenders, setFetchingSenders] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/common/settings/get_settings/');
            setSettings(res.data.settings);
            setDraft(res.data.settings);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSmsPreview = async () => {
        try {
            const res = await api.get('/common/settings/sms_template_preview/');
            setSmsPreview(res.data.preview);
        } catch (e) { console.error(e); }
    };

    const fetchVoices = async () => {
        setFetchingVoices(true);
        try {
            const res = await api.get('/common/voip/calls/list_voices/');
            if (res.data.success) {
                const list = res.data.voices || [];
                setVoices(list.map((v: any) => v.name || v));
            }
        } catch (e) { console.error(e); }
        finally { setFetchingVoices(false); }
    };

    const fetchSenders = async () => {
        setFetchingSenders(true);
        try {
            const res = await api.get('/common/voip/calls/list_senders/');
            if (res.data.success) {
                const list = res.data.senders || [];
                setSenders(list.map((s: any) => s.phone_number || s.number || s));
            }
        } catch (e) { console.error(e); }
        finally { setFetchingSenders(false); }
    };

    useEffect(() => { fetchSettings(); }, []);
    useEffect(() => { if (draft.payment_reminder_sms_template) fetchSmsPreview(); }, [draft.payment_reminder_sms_template]);

    const update = (key: keyof SystemSettings, value: any) => {
        setDraft(prev => ({ ...prev, [key]: value }));
        setSaveResult(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveResult(null);
        try {
            const res = await api.patch('/common/settings/update_settings/', draft);
            if (res.data.success) {
                setSettings(res.data.settings);
                setDraft(res.data.settings);
                setSaveResult({ success: true, message: 'Settings saved successfully.' });
            } else {
                setSaveResult({ success: false, message: JSON.stringify(res.data.errors) });
            }
        } catch (e: any) {
            setSaveResult({ success: false, message: e.response?.data?.message || 'Failed to save settings.' });
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            {/* Balance Cards */}
            <BalanceSection />

            {/* Invoice Settings */}
            <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-5">
                <SectionHeader
                    icon={<FileText className="w-5 h-5" />}
                    title="Invoice Settings"
                    description="Control how invoices are generated and sent"
                />
                <Toggle
                    value={draft.auto_generate_invoices ?? true}
                    onChange={v => update('auto_generate_invoices', v)}
                    label="Auto-Generate Invoices"
                    description="Automatically generate next month's invoices before the month ends"
                />
                <div className="h-px bg-border" />
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">
                        Days Before Month-End to Generate
                    </label>
                    <input
                        type="number"
                        min={1} max={15}
                        value={draft.invoice_generation_days ?? 7}
                        onChange={e => update('invoice_generation_days', parseInt(e.target.value))}
                        className="input-field w-24 text-sm"
                    />
                    <p className="text-xs text-body-muted mt-1">Invoices for the next month are generated this many days before the current month ends.</p>
                </div>
            </div>

            {/* SMS Settings */}
            <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-5">
                <SectionHeader
                    icon={<MessageSquare className="w-5 h-5" />}
                    title="SMS Settings"
                    description="Configure GreenWeb SMS reminders and templates"
                />
                <Toggle
                    value={draft.auto_send_reminders ?? true}
                    onChange={v => update('auto_send_reminders', v)}
                    label="Auto-Send SMS Reminders"
                    description="Send payment reminder SMS on configured reminder days"
                />
                <div className="h-px bg-border" />
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">
                        SMS Rate per Unit (Tk)
                    </label>
                    <div className="relative w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-body-muted font-bold">৳</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={draft.sms_rate ?? 0.40}
                            onChange={e => update('sms_rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.40"
                            className="input-field text-sm font-mono pl-8 w-full"
                        />
                    </div>
                    <p className="text-xs text-body-muted mt-1">Cost per SMS unit in Taka (BDT) used for estimates and logs.</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">
                        Reminder Days (comma-separated, 1–28)
                    </label>
                    <input
                        type="text"
                        value={draft.payment_reminder_days ?? '3,7'}
                        onChange={e => update('payment_reminder_days', e.target.value)}
                        placeholder="3,7,15"
                        className="input-field text-sm font-mono w-48"
                    />
                    <p className="text-xs text-body-muted mt-1">SMS reminders are sent on these days of the month.</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">
                        Payment Reminder SMS Template (Bangla)
                    </label>
                    <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary/20 rounded-xl p-3 mb-2">
                        <p className="text-xs text-primary font-medium flex items-center gap-1.5 mb-1.5">
                            <Info className="w-3.5 h-3.5" />Available Variables:
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                            {['{student_name}', '{months}', '{amount}', '{course_name}'].map(v => (
                                <code key={v} className="bg-white dark:bg-black/20 border border-primary/20 text-primary px-1.5 py-0.5 rounded-md">{v}</code>
                            ))}
                        </div>
                    </div>
                    <textarea
                        value={draft.payment_reminder_sms_template ?? ''}
                        onChange={e => update('payment_reminder_sms_template', e.target.value)}
                        rows={5}
                        className="input-field text-sm font-sans resize-none w-full"
                        dir="auto"
                    />
                    {smsPreview && (
                        <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-default">
                            <p className="text-xs font-medium text-body-muted mb-1.5">Preview (sample data):</p>
                            <p className="text-sm text-body whitespace-pre-wrap" dir="auto">{smsPreview}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* VoIP Settings */}
            <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-5">
                <SectionHeader
                    icon={<Phone className="w-5 h-5" />}
                    title="VoIP / Call Settings"
                    description="Configure AwajDigital automated payment reminder calls"
                    badge={draft.voip_enabled ? { label: 'Enabled', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' } : { label: 'Disabled', color: 'text-body-muted bg-neutral-100 dark:bg-neutral-800' }}
                />

                {!draft.awajdigital_voice_name && !draft.awajdigital_sender_number && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Setup Required</p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                Configure your voice name and sender number before enabling VoIP. These must match settings in your AwajDigital dashboard.
                            </p>
                        </div>
                    </div>
                )}

                <Toggle
                    value={draft.voip_enabled ?? false}
                    onChange={v => update('voip_enabled', v)}
                    label="Enable VoIP Call Reminders"
                    description="Allow the system to make automated voice calls to parents"
                />
                <div className="h-px bg-border" />

                {/* Voice Name */}
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">Voice Recording Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={draft.awajdigital_voice_name ?? ''}
                            onChange={e => update('awajdigital_voice_name', e.target.value)}
                            placeholder="e.g. payment_reminder"
                            list="voiceslist"
                            className="input-field text-sm flex-1"
                        />
                        <datalist id="voiceslist">
                            {voices.map(v => <option key={v} value={v} />)}
                        </datalist>
                        <button onClick={fetchVoices} disabled={fetchingVoices}
                            className="btn-secondary text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <RefreshCw className={cn('w-3.5 h-3.5', fetchingVoices && 'animate-spin')} />
                            Fetch Voices
                        </button>
                    </div>
                    <p className="text-xs text-body-muted mt-1">Name of the pre-uploaded audio from your AwajDigital dashboard.</p>
                    {voices.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {voices.map(v => (
                                <button key={v} type="button"
                                    onClick={() => update('awajdigital_voice_name', v)}
                                    className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                                        draft.awajdigital_voice_name === v ? 'bg-primary text-white border-primary' : 'border-default text-body hover:border-primary')}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sender Number */}
                <div>
                    <label className="text-sm font-medium text-body-muted mb-1.5 block">Approved Sender Number</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={draft.awajdigital_sender_number ?? ''}
                            onChange={e => update('awajdigital_sender_number', e.target.value)}
                            placeholder="e.g. 01XXXXXXXXX"
                            list="senderslist"
                            className="input-field text-sm font-mono flex-1"
                        />
                        <datalist id="senderslist">
                            {senders.map(s => <option key={s} value={s} />)}
                        </datalist>
                        <button onClick={fetchSenders} disabled={fetchingSenders}
                            className="btn-secondary text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <RefreshCw className={cn('w-3.5 h-3.5', fetchingSenders && 'animate-spin')} />
                            Fetch Senders
                        </button>
                    </div>
                    <p className="text-xs text-body-muted mt-1">Your approved caller ID from AwajDigital.</p>
                    {senders.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {senders.map(s => (
                                <button key={s} type="button"
                                    onClick={() => update('awajdigital_sender_number', s)}
                                    className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors font-mono',
                                        draft.awajdigital_sender_number === s ? 'bg-primary text-white border-primary' : 'border-default text-body hover:border-primary')}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-px bg-border" />

                {/* Call Times */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-body-muted mb-1.5 block">Morning Call Time (BST)</label>
                        <input
                            type="time"
                            value={draft.voip_call_time_morning ?? '10:30'}
                            onChange={e => update('voip_call_time_morning', e.target.value)}
                            className="input-field text-sm"
                        />
                        <p className="text-xs text-body-muted mt-1">Initial + follow-up morning calls</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-body-muted mb-1.5 block">Evening Call Time (BST)</label>
                        <input
                            type="time"
                            value={draft.voip_call_time_evening ?? '16:30'}
                            onChange={e => update('voip_call_time_evening', e.target.value)}
                            className="input-field text-sm"
                        />
                        <p className="text-xs text-body-muted mt-1">Evening follow-up calls only</p>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Campaign Toggles */}
                <Toggle
                    value={draft.voip_5th_day_enabled ?? true}
                    onChange={v => update('voip_5th_day_enabled', v)}
                    label="5th Day Campaign"
                    description="Start calling on the 5th of each month if invoice is unpaid"
                />
                <div className="h-px bg-border" />
                <Toggle
                    value={draft.voip_10th_day_enabled ?? true}
                    onChange={v => update('voip_10th_day_enabled', v)}
                    label="10th Day Campaign"
                    description="Start a second calling campaign on the 10th if still unpaid"
                />

                {/* Logic Summary */}
                <div className="bg-page-subtle rounded-xl p-4 border border-default text-xs text-body-muted space-y-1.5">
                    <p className="font-medium text-body flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-primary" />Automated Calling Logic</p>
                    <p>• <strong className="text-body">5th (morning):</strong> Initial call + SMS to all parents with unpaid invoices</p>
                    <p>• <strong className="text-body">5th–9th:</strong> Daily follow-up calls (morning + evening) until call is answered</p>
                    <p>• <strong className="text-body">10th (morning):</strong> New campaign — call + SMS to still-unpaid parents</p>
                    <p>• <strong className="text-body">10th+:</strong> Same daily follow-up pattern, independent of 5th campaign</p>
                    <p>• Follow-ups stop once a call is answered. Paying stops follow-ups automatically.</p>
                </div>
            </div>

            {/* Save */}
            {saveResult && (
                <div className={cn('rounded-2xl border p-4 flex items-center gap-3 text-sm',
                    saveResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400')}>
                    {saveResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    {saveResult.message}
                </div>
            )}

            <div className="flex items-center justify-between pb-6">
                <p className="text-xs text-body-muted">
                    {settings?.updated_at ? `Last saved: ${new Date(settings.updated_at).toLocaleString('en-BD')}` : ''}
                </p>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 px-6">
                    {saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Settings</>}
                </button>
            </div>
        </div>
    );
}
