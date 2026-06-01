'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    Search,
    Loader2,
    UserCircle,
    ChevronDown,
    Shield,
    User as UserIcon,
    Phone,
    MapPin,
    Facebook,
    Mail,
    Calendar,
    Users,
    UserPlus,
    X,
    Eye,
    EyeOff,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi, AdminCreateUserData } from '@/lib/adminApi';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type RoleFilter = 'all' | 'admin' | 'parent';
type SortField = 'name' | 'joined';
type SortOrder = 'asc' | 'desc';

interface CreateUserFormState {
    name: string;
    phone: string;
    address: string;
    facebook_profile: string;
    email: string;
    new_password: string;
    confirm_password: string;
    is_admin: boolean;
    password: string; // admin's own password
}

const EMPTY_FORM: CreateUserFormState = {
    name: '',
    phone: '',
    address: '',
    facebook_profile: '',
    email: '',
    new_password: '',
    confirm_password: '',
    is_admin: false,
    password: '',
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [sortBy, setSortBy] = useState<SortField>('joined');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Add User modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState<CreateUserFormState>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateUserFormState | '_general', string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [showAdminPw, setShowAdminPw] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showAdminConfirm, setShowAdminConfirm] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Close modal on outside click
    useEffect(() => {
        if (!showAddModal) return;
        const handler = (e: MouseEvent) => {
            if (showAdminConfirm) return; // Prevent closing if sub-modal is open
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                handleCloseModal();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showAddModal, showAdminConfirm]);

    // Lock scroll when modal open
    useEffect(() => {
        document.body.style.overflow = showAddModal ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showAddModal]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            let response;
            const params = searchQuery ? { search: searchQuery } : undefined;
            if (roleFilter === 'admin') {
                response = await adminApi.getAllAdmins(params);
            } else if (roleFilter === 'parent') {
                response = await adminApi.getAllParents(params);
            } else {
                response = await adminApi.getAllUsers(params);
            }
            const usersData = Array.isArray(response.data) ? response.data : response.data.results;
            setUsers(usersData || []);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, [roleFilter, searchQuery]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'joined') {
                const dateA = a.date_joined ? new Date(a.date_joined).getTime() : a.id || 0;
                const dateB = b.date_joined ? new Date(b.date_joined).getTime() : b.id || 0;
                comparison = dateA - dateB;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [users, sortBy, sortOrder]);

    const handleCloseModal = () => {
        if (submitting) return;
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
        setSuccessMsg('');
        setShowNewPw(false);
        setShowConfirmPw(false);
        setShowAdminPw(false);
        setShowAdminConfirm(false);
    };

    const handleFormChange = (field: keyof CreateUserFormState, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear field error on change
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const errors: Partial<Record<keyof CreateUserFormState | '_general', string>> = {};
        if (!form.name.trim()) errors.name = 'Name is required.';
        if (!form.phone.trim()) errors.phone = 'Phone number is required.';
        else if (!/^01[2-9]\d{8}$/.test(form.phone.trim())) errors.phone = 'Must be a valid Bangladesh number (01XXXXXXXXX).';
        if (!form.address.trim()) errors.address = 'Address is required.';
        if (!form.new_password) errors.new_password = 'Password is required.';
        else if (form.new_password.length < 6) errors.new_password = 'Password must be at least 6 characters.';
        if (!form.confirm_password) errors.confirm_password = 'Please confirm the password.';
        else if (form.new_password !== form.confirm_password) errors.confirm_password = "Passwords don't match.";
        if (!form.password) errors.password = 'Your admin password is required.';

        if (Object.keys(errors).length) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        setFormErrors({});

        try {
            const payload: AdminCreateUserData = {
                name: form.name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                new_password: form.new_password,
                confirm_password: form.confirm_password,
                facebook_profile: form.facebook_profile.trim() || undefined,
                email: form.email.trim() || undefined,
                is_admin: form.is_admin,
                password: form.password,
            };
            const res = await adminApi.adminCreateUser(payload);
            setSuccessMsg(res.data.message || `User ${form.name} created successfully.`);
            // Refresh the list
            await fetchUsers();
            // Auto-close after 1.5s
            setTimeout(() => handleCloseModal(), 1500);
        } catch (err: any) {
            const data = err?.response?.data;
            if (data?.errors) {
                setFormErrors(data.errors);
            } else {
                setFormErrors({ _general: data?.message || 'Something went wrong. Please try again.' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                {/* Search and Filters */}
                <div className="p-4 border-b border-default space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-body-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name, phone, or address..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <div className="flex rounded-xl border border-default bg-input p-1 w-full sm:w-auto">
                                {(['all', 'parent', 'admin'] as const).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={cn(
                                            "flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors text-center",
                                            roleFilter === r 
                                                ? "bg-primary text-primary-foreground shadow-sm" 
                                                : "text-body-muted hover:text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="relative flex items-center gap-2 border-l-0 sm:border-l border-default pl-0 sm:pl-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowSortDropdown(prev => !prev)}
                                    className="inline-flex items-center justify-between sm:justify-start gap-2 px-4 py-2 border border-default rounded-xl bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium w-full sm:w-auto"
                                >
                                    <span>Sort by: {sortBy === 'name' ? 'Name' : 'Joined'}</span>
                                    <ChevronDown className="w-4 h-4 shrink-0" />
                                </button>

                                {showSortDropdown && (
                                    <div className="absolute right-0 mt-2 w-full sm:w-40 bg-card border border-default rounded-xl shadow-lg z-10 top-full overflow-hidden">
                                        {(['name', 'joined'] as const).map((field) => (
                                            <button
                                                key={field}
                                                onClick={() => {
                                                    setSortBy(field);
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-sm ${
                                                    sortBy === field 
                                                        ? 'bg-primary text-primary-foreground font-semibold' 
                                                        : 'text-heading'
                                                }`}
                                            >
                                                {field === 'name' ? 'Name' : 'Joined'}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="p-2.5 rounded-xl border border-default bg-input hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                                >
                                    <ChevronDown className={cn(
                                        'w-5 h-5 transition-transform',
                                        sortOrder === 'asc' && 'rotate-180'
                                    )} />
                                </button>

                                {/* Add User Button */}
                                <button
                                    id="add-user-btn"
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shrink-0 shadow-sm"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Add User</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : sortedUsers.length > 0 ? (
                    <>
                        {/* Mobile View - Compact List */}
                        <div className="md:hidden divide-y divide-default">
                            {sortedUsers.map((user) => (
                                <div 
                                    key={user.id} 
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                            user.is_admin ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light"
                                        )}>
                                            {user.is_admin ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="font-semibold text-heading truncate">{user.name}</p>
                                                {user.is_admin && (
                                                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-body-muted">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{user.address}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-default/50">
                                                {user.facebook_profile && (
                                                    <a 
                                                        href={user.facebook_profile} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                                                    >
                                                        <Facebook className="w-4 h-4 shrink-0" />
                                                        <span>Profile</span>
                                                    </a>
                                                )}
                                                <a 
                                                    href={`tel:${user.phone}`} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium"
                                                >
                                                    <Phone className="w-4 h-4 shrink-0" />
                                                    <span>Call</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-visible">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-default bg-neutral-50 dark:bg-neutral-900/50">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            User Info
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Facebook
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {sortedUsers.map((user) => (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                        user.is_admin ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light"
                                                    )}>
                                                        {user.is_admin ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-heading">
                                                            {user.name}
                                                        </p>
                                                        <div className="flex items-center gap-1 text-xs text-body-muted mt-0.5">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate max-w-[200px]">{user.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.is_admin ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-light text-xs font-medium">
                                                        <UserIcon className="w-3.5 h-3.5" />
                                                        Parent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a 
                                                    href={`tel:${user.phone}`} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium"
                                                >
                                                    <Phone className="w-4 h-4 shrink-0" />
                                                    <span>{user.phone}</span>
                                                </a>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.facebook_profile && (
                                                    <a 
                                                        href={user.facebook_profile} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                                                        title="Facebook Profile"
                                                    >
                                                        <Facebook className="w-4 h-4 shrink-0" />
                                                        <span>View Profile</span>
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-sm text-body-muted">
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 mx-auto mb-4 text-body-subtle" />
                        <h3 className="text-lg font-semibold text-heading mb-2">
                            {searchInput ? 'No users found' : 'No users available'}
                        </h3>
                        <p className="text-body-muted">
                            {searchInput 
                                ? 'Try adjusting your search query'
                                : 'Users will appear here once they register'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div
                        ref={modalRef}
                        className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-default shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-slide-up sm:animate-scale-in"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-heading">Add New User</h2>
                                    <p className="text-xs text-body-muted">No OTP required — admin creation</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                disabled={submitting}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-body-muted hover:text-heading"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            {successMsg ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <p className="font-semibold text-heading text-lg">{successMsg}</p>
                                    <p className="text-sm text-body-muted">User list has been refreshed.</p>
                                </div>
                            ) : (
                                <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4">
                                    {formErrors._general && (
                                        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                            {formErrors._general}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-name" className="text-sm font-medium text-heading flex items-center gap-1.5">
                                            <UserIcon className="w-3.5 h-3.5 text-body-muted" />
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="add-user-name"
                                            type="text"
                                            value={form.name}
                                            onChange={e => handleFormChange('name', e.target.value)}
                                            placeholder="e.g. Rahim Uddin"
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                formErrors.name ? "border-red-400 dark:border-red-600" : "border-default"
                                            )}
                                        />
                                        {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-phone" className="text-sm font-medium text-heading flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-body-muted" />
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="add-user-phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => handleFormChange('phone', e.target.value)}
                                            placeholder="01XXXXXXXXX"
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                formErrors.phone ? "border-red-400 dark:border-red-600" : "border-default"
                                            )}
                                        />
                                        {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-address" className="text-sm font-medium text-heading flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-body-muted" />
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="add-user-address"
                                            type="text"
                                            value={form.address}
                                            onChange={e => handleFormChange('address', e.target.value)}
                                            placeholder="e.g. Dhaka, Bangladesh"
                                            className={cn(
                                                "w-full px-3.5 py-2.5 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                formErrors.address ? "border-red-400 dark:border-red-600" : "border-default"
                                            )}
                                        />
                                        {formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}
                                    </div>

                                    {/* Facebook + Email (2 cols) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="add-user-fb" className="text-sm font-medium text-heading flex items-center gap-1.5">
                                                <Facebook className="w-3.5 h-3.5 text-body-muted" />
                                                Facebook URL
                                            </label>
                                            <input
                                                id="add-user-fb"
                                                type="url"
                                                value={form.facebook_profile}
                                                onChange={e => handleFormChange('facebook_profile', e.target.value)}
                                                placeholder="https://facebook.com/..."
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="add-user-email" className="text-sm font-medium text-heading flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-body-muted" />
                                                Email
                                            </label>
                                            <input
                                                id="add-user-email"
                                                type="email"
                                                value={form.email}
                                                onChange={e => handleFormChange('email', e.target.value)}
                                                placeholder="user@example.com"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-default bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-newpw" className="text-sm font-medium text-heading">
                                            User Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="add-user-newpw"
                                                type={showNewPw ? 'text' : 'password'}
                                                value={form.new_password}
                                                onChange={e => handleFormChange('new_password', e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className={cn(
                                                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                    formErrors.new_password ? "border-red-400 dark:border-red-600" : "border-default"
                                                )}
                                            />
                                            <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading">
                                                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {formErrors.new_password && <p className="text-xs text-red-500">{formErrors.new_password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-confirmpw" className="text-sm font-medium text-heading">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="add-user-confirmpw"
                                                type={showConfirmPw ? 'text' : 'password'}
                                                value={form.confirm_password}
                                                onChange={e => handleFormChange('confirm_password', e.target.value)}
                                                placeholder="Re-enter password"
                                                className={cn(
                                                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                    formErrors.confirm_password ? "border-red-400 dark:border-red-600" : "border-default"
                                                )}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading">
                                                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {formErrors.confirm_password && <p className="text-xs text-red-500">{formErrors.confirm_password}</p>}
                                    </div>

                                    {/* Make Admin toggle */}
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-default bg-neutral-50 dark:bg-neutral-900/40">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-heading">Grant Admin Role</p>
                                                <p className="text-xs text-body-muted">User will have full admin access</p>
                                            </div>
                                        </div>
                                        <button
                                            id="add-user-admin-toggle"
                                            type="button"
                                            onClick={() => {
                                                if (!form.is_admin) {
                                                    setShowAdminConfirm(true);
                                                } else {
                                                    handleFormChange('is_admin', false);
                                                }
                                            }}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                                                form.is_admin ? "bg-amber-500" : "bg-neutral-300 dark:bg-neutral-600"
                                            )}
                                            role="switch"
                                            aria-checked={form.is_admin}
                                        >
                                            <span className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                                                form.is_admin ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-default" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-3 text-xs text-body-muted bg-card">Admin Verification</span>
                                        </div>
                                    </div>

                                    {/* Admin password verification */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="add-user-adminpw" className="text-sm font-medium text-heading">
                                            Your Admin Password <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-body-muted -mt-0.5">Required to authorize this action</p>
                                        <div className="relative">
                                            <input
                                                id="add-user-adminpw"
                                                type={showAdminPw ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => handleFormChange('password', e.target.value)}
                                                placeholder="Your current password"
                                                className={cn(
                                                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-input text-heading placeholder:text-body-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm",
                                                    formErrors.password ? "border-red-400 dark:border-red-600" : "border-default"
                                                )}
                                            />
                                            <button type="button" onClick={() => setShowAdminPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading">
                                                {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!successMsg && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-default shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl border border-default bg-input text-heading hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="add-user-form"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Admin Role Confirmation Dialogue */}
            {showAdminConfirm && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                    <Shield className="w-6 h-6 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-semibold text-heading">Confirm Admin Access</h3>
                            </div>
                            
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                    Warning: Critical Privileges
                                </p>
                                <ul className="text-xs text-amber-700/95 dark:text-amber-400/95 space-y-1.5 list-disc pl-4">
                                    <li>User will have full access to dashboard, students, and payments.</li>
                                    <li>User can add, modify, or delete any system data.</li>
                                    <li>User can manage other administrators.</li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminConfirm(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-heading transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        handleFormChange('is_admin', true);
                                        setShowAdminConfirm(false);
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-xs rounded-xl"
                                >
                                    Confirm Admin Role
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

