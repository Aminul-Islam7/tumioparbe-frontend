'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    Shield,
    User as UserIcon,
    Phone,
    MapPin,
    Facebook,
    Mail,
    Calendar,
    GraduationCap,
    Clock,
    Users,
    BookOpen,
    Pencil,
    Check,
    X,
    ShieldAlert,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
import { User, Student, AdminStudent } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.userId);
    const { user: currentUser } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [children, setChildren] = useState<AdminStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingField, setEditingField] = useState<'name' | 'email' | 'address' | 'facebook_profile' | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const [adminRoleModal, setAdminRoleModal] = useState<{ isOpen: boolean, action: 'grant' | 'revoke' }>({ isOpen: false, action: 'grant' });
    const [adminPassword, setAdminPassword] = useState('');
    const [grantingAdmin, setGrantingAdmin] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);

    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        field: 'name' | 'email' | 'address' | 'facebook_profile' | null;
        finalValue: string;
    }>({
        isOpen: false,
        field: null,
        finalValue: ''
    });

    const startEditing = (field: 'name' | 'email' | 'address' | 'facebook_profile', value: string) => {
        setEditingField(field);
        setEditValue(value || '');
        setValidationError(null);
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
        setValidationError(null);
    };

    const handleSave = (field: 'name' | 'email' | 'address' | 'facebook_profile') => {
        if (!user) return;
        setValidationError(null);

        const trimmedValue = editValue.trim();

        // Frontend validations
        if (field === 'email' && trimmedValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedValue)) {
                setValidationError('Please enter a valid email address.');
                return;
            }
        }

        let finalValue = trimmedValue;
        if (field === 'facebook_profile' && trimmedValue) {
            const fbRegex = /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/i;
            if (!fbRegex.test(trimmedValue)) {
                setValidationError('Please enter a valid Facebook profile URL.');
                return;
            }
            // Auto-prepend https:// if missing
            if (!/^https?:\/\//i.test(trimmedValue)) {
                finalValue = `https://${trimmedValue}`;
            }
        }

        // Check if value is identical to current user value
        const oldValue = user[field] || '';
        if (oldValue === finalValue) {
            cancelEditing();
            return;
        }

        // Open Confirmation Modal
        setConfirmModalState({
            isOpen: true,
            field,
            finalValue
        });
    };

    const executeSave = async () => {
        const { field, finalValue } = confirmModalState;
        if (!user || !field) return;

        try {
            setSaving(true);
            const response = await adminApi.updateUser(user.id, { [field]: finalValue });
            setUser(response.data);
            setEditingField(null);
            setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        } catch (err: any) {
            console.error('Failed to update user:', err);
            const backendErrors = err.response?.data;
            if (backendErrors && typeof backendErrors === 'object') {
                const firstError = Object.values(backendErrors)[0];
                setValidationError(Array.isArray(firstError) ? firstError[0] : 'Validation failed.');
            } else {
                setValidationError('Failed to update field.');
            }
            setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        } finally {
            setSaving(false);
        }
    };

    const cancelSave = () => {
        setConfirmModalState({ isOpen: false, field: null, finalValue: '' });
        cancelEditing();
    };

    const handleAdminRoleChange = async () => {
        if (!user || !adminPassword) {
            setAdminError('Password is required.');
            return;
        }
        try {
            setGrantingAdmin(true);
            setAdminError(null);
            
            const isGranting = adminRoleModal.action === 'grant';
            const response = isGranting 
                ? await adminApi.grantAdmin(user.id, adminPassword)
                : await adminApi.revokeAdmin(user.id, adminPassword);
                
            setUser(response.data.user);
            setAdminRoleModal({ isOpen: false, action: 'grant' });
            setAdminPassword('');
        } catch (err: any) {
            console.error(`Failed to ${adminRoleModal.action} admin privileges:`, err);
            setAdminError(err.response?.data?.message || `Failed to verify password and ${adminRoleModal.action} admin privileges.`);
        } finally {
            setGrantingAdmin(false);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const userResponse = await adminApi.getUser(userId);
            setUser(userResponse.data);

            const studentsResponse = await adminApi.getAllStudents({ parent: userId });
            // @ts-ignore - Handle possible unpaginated response too
            const studentsData = Array.isArray(studentsResponse.data) ? studentsResponse.data : studentsResponse.data.results;
            setChildren(studentsData || []);
        } catch (err) {
            console.error('Failed to load user details:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-body-muted">User not found</p>
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/users')}
                    className="mt-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb and Header */}
            <div>
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-sm text-body-muted hover:text-primary transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Users
                </Link>
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center shrink-0",
                            user.is_admin ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400"
                        )}>
                            {user.is_admin ? <Shield className="h-8 w-8" /> : <UserIcon className="h-8 w-8" />}
                        </div>
                        <div>
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                {editingField === 'name' ? (
                                    <div className="flex flex-col gap-2 w-full max-w-[240px]">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => {
                                                setEditValue(e.target.value);
                                                setValidationError(null);
                                            }}
                                            className="w-full px-2 py-1.5 border border-default rounded-lg text-lg font-bold bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSave('name');
                                                if (e.key === 'Escape') cancelEditing();
                                            }}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={cancelEditing} 
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Cancel</span>
                                            </button>
                                            <button 
                                                onClick={() => handleSave('name')} 
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                            >
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                <span>Save</span>
                                            </button>
                                        </div>
                                        {validationError && (
                                            <span className="text-xs text-red-500 font-normal">{validationError}</span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-heading">{user.name}</h1>
                                        <button
                                            onClick={() => startEditing('name', user.name)}
                                            className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                            title="Edit Name"
                                        >
                                            <Pencil className="w-4 h-4 shrink-0" />
                                        </button>
                                    </>
                                )}
                                {user.is_admin ? (
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                            <Shield className="w-3.5 h-3.5" />
                                            Admin
                                        </span>
                                        {currentUser?.id !== user.id && (
                                            <button 
                                                onClick={() => setAdminRoleModal({ isOpen: true, action: 'revoke' })}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium transition-colors border border-neutral-200 dark:border-neutral-700"
                                                title="Revoke Admin Privileges"
                                            >
                                                <UserIcon className="w-3 h-3" />
                                                Make Parent
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                                            <UserIcon className="w-3.5 h-3.5" />
                                            Parent
                                        </span>
                                        <button 
                                            onClick={() => setAdminRoleModal({ isOpen: true, action: 'grant' })}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-500 text-xs font-medium transition-colors border border-amber-200/50 dark:border-amber-700/50"
                                            title="Give Admin Privileges"
                                        >
                                            <ShieldAlert className="w-3 h-3" />
                                            Make Admin
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-body-muted flex items-center gap-1 text-sm">
                                <span className="font-medium">User ID:</span> {user.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card rounded-2xl border border-default shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-heading border-b border-default pb-3">
                            Contact Information
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-body-muted mb-0.5">Phone Number</p>
                                    <p className="font-medium text-heading">{user.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Email Address</p>
                                    {editingField === 'email' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="email"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter email address"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('email');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('email')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", user.email ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {user.email || 'No email provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('email', user.email || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Email"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Address</p>
                                    {editingField === 'address' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="Enter address"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('address');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('address')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium", user.address ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {user.address || 'No address provided'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('address', user.address || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Address"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                    <Facebook className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-body-muted mb-0.5">Facebook Profile</p>
                                    {editingField === 'facebook_profile' ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            <input
                                                type="url"
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    setValidationError(null);
                                                    setValidationError(null);
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-default rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                                placeholder="https://facebook.com/..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave('facebook_profile');
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={cancelEditing} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSave('facebook_profile')} 
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md font-medium transition-colors shrink-0"
                                                >
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                            {validationError && (
                                                <span className="text-xs text-red-500 font-medium">{validationError}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className={cn("font-medium truncate", user.facebook_profile ? "text-heading" : "text-body-subtle italic text-sm")}>
                                                {user.facebook_profile || 'No Facebook profile linked'}
                                            </p>
                                            <button
                                                onClick={() => startEditing('facebook_profile', user.facebook_profile || '')}
                                                className="p-1 text-body-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                                title="Edit Facebook Profile"
                                            >
                                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {user.date_joined && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary rounded-lg shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-body-muted mb-0.5">Joined</p>
                                        <p className="font-medium text-heading">
                                            {new Date(user.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-default space-y-3">
                            <a 
                                href={`tel:${user.phone}`} 
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200/80 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors font-medium"
                            >
                                <Phone className="w-5 h-5 shrink-0" />
                                {user.is_admin ? 'Call Admin' : 'Call Parent'}
                            </a>

                            {user.facebook_profile && (
                                <a 
                                    href={user.facebook_profile} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-xl transition-colors font-medium"
                                >
                                    <Facebook className="w-5 h-5 shrink-0" />
                                    View Facebook Profile
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Children / Activity Column */}
                <div className="lg:col-span-2 space-y-6">
                    {user.is_admin && (
                        <div className="bg-card rounded-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-amber-50/30 dark:bg-amber-900/5 text-center sm:text-left">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl shrink-0 text-amber-600 dark:text-amber-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-heading mb-1">Admin User</h2>
                                <p className="text-body-muted text-sm max-w-lg">
                                    This user has administrative privileges and can manage courses, batches, and users across the platform.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-default flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-heading mb-1">Children</h2>
                                <p className="text-sm text-body-muted">Students registered under this {user.is_admin ? 'admin' : 'parent'}</p>
                            </div>
                            <div className="p-3 bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {children.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {children.map((child) => (
                                        <Link 
                                            key={child.id} 
                                            href={`/admin/students/${child.id}`}
                                            className="group block border border-default rounded-xl p-4 hover:border-lavender-500/50 dark:hover:border-lavender-400/50 transition-colors bg-neutral-50/50 dark:bg-neutral-900/20"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-10 w-10 bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    <GraduationCap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-heading group-hover:text-lavender-600 dark:group-hover:text-lavender-400 transition-colors">{child.name}</h3>
                                                    <p className="text-xs text-body-muted">Student ID: {child.id}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mt-4 pt-3 border-t border-default/50">
                                                <div className="flex items-center gap-2 text-sm text-body-muted">
                                                    <Calendar className="w-4 h-4 shrink-0 text-body-subtle group-hover:text-lavender-400 dark:group-hover:text-lavender-300/80 transition-colors" />
                                                    <span>Born: {new Date(child.date_of_birth).toLocaleDateString()}</span>
                                                </div>
                                                {child.school && (
                                                    <div className="flex items-center gap-2 text-sm text-body-muted">
                                                        <MapPin className="w-4 h-4 shrink-0 text-body-subtle group-hover:text-lavender-400 dark:group-hover:text-lavender-300/80 transition-colors" />
                                                        <span className="truncate">School: {child.school}</span>
                                                    </div>
                                                )}
                                                {child.current_class && (
                                                    <div className="flex items-center gap-2 text-sm text-body-muted">
                                                        <BookOpen className="w-4 h-4 shrink-0 text-body-subtle group-hover:text-lavender-400 dark:group-hover:text-lavender-300/80 transition-colors" />
                                                        <span>Class: {child.current_class}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <GraduationCap className="w-12 h-12 mx-auto text-body-subtle mb-3" />
                                    <p className="text-heading font-medium">No children registered yet.</p>
                                    <p className="text-body-muted text-sm mt-1">This user has not added any students.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModalState.isOpen && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-default shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-heading mb-2">Confirm Update</h3>
                            <p className="text-body-muted mb-6">
                                Are you sure you want to update the <span className="font-semibold text-heading capitalize">{confirmModalState.field?.replace('_', ' ')}</span>?
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6 bg-surface rounded-xl p-4 border border-default">
                                <div>
                                    <p className="text-xs text-body-subtle mb-1">Old Value</p>
                                    <p className="text-sm font-medium text-body-muted break-all">
                                        {user?.[confirmModalState.field!] || <span className="italic text-body-subtle">Empty</span>}
                                    </p>
                                </div>
                                <div className="border-l border-default pl-3">
                                    <p className="text-xs text-body-subtle mb-1">New Value</p>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 break-all">
                                        {confirmModalState.finalValue || <span className="italic text-red-500 font-medium">To be cleared</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={cancelSave}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={executeSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Confirm Update'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Role Modal */}
            {adminRoleModal.isOpen && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={cn(
                        "bg-card w-full max-w-md rounded-2xl border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200",
                        adminRoleModal.action === 'grant' ? "border-amber-500/30" : "border-neutral-500/30"
                    )}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    adminRoleModal.action === 'grant' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                )}>
                                    {adminRoleModal.action === 'grant' ? <ShieldAlert className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                                </div>
                                <h3 className="text-xl font-semibold text-heading">
                                    {adminRoleModal.action === 'grant' ? 'Grant Admin Privileges' : 'Revoke Admin Privileges'}
                                </h3>
                            </div>
                            
                            <div className={cn(
                                "border rounded-xl p-4 mb-6",
                                adminRoleModal.action === 'grant' 
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50" 
                                    : "bg-neutral-50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800"
                            )}>
                                <p className={cn(
                                    "text-sm font-medium mb-2",
                                    adminRoleModal.action === 'grant' ? "text-amber-800 dark:text-amber-300" : "text-heading"
                                )}>
                                    Consequences of this action:
                                </p>
                                <ul className={cn(
                                    "text-xs space-y-1.5 list-disc pl-4",
                                    adminRoleModal.action === 'grant' ? "text-amber-700/80 dark:text-amber-400/80" : "text-body-muted"
                                )}>
                                    {adminRoleModal.action === 'grant' ? (
                                        <>
                                            <li>They will have full, unrestricted control over the system dashboard.</li>
                                            <li>They can view, modify, or delete any students, payments, and users.</li>
                                            <li>They can grant admin privileges to other parents.</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>They will lose access to the admin dashboard completely.</li>
                                            <li>They will only be able to view their own children and payments.</li>
                                            <li>You can always grant them privileges again later if needed.</li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className="block text-sm font-medium text-heading">
                                    Verify your password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-subtle" />
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => {
                                            setAdminPassword(e.target.value);
                                            setAdminError(null);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 bg-input border border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        placeholder="Enter your current password"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAdminRoleChange();
                                        }}
                                    />
                                </div>
                                {adminError && (
                                    <p className="text-xs text-red-500 font-medium">{adminError}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setAdminRoleModal({ isOpen: false, action: 'grant' });
                                        setAdminPassword('');
                                        setAdminError(null);
                                    }}
                                    disabled={grantingAdmin}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAdminRoleChange}
                                    disabled={grantingAdmin || !adminPassword}
                                    className={cn(
                                        "text-white",
                                        adminRoleModal.action === 'grant' ? "bg-amber-600 hover:bg-amber-700" : "bg-neutral-700 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    {grantingAdmin ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        adminRoleModal.action === 'grant' ? 'Grant Privileges' : 'Revoke Privileges'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
