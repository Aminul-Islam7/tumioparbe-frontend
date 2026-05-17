'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Search,
    Filter,
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
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RoleFilter = 'all' | 'admin' | 'parent';
type SortField = 'name' | 'joined';
type SortOrder = 'asc' | 'desc';

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

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

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

    // Client-side sorting since API doesn't have ordering filter configured
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
                                placeholder="Search by name or phone..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <div className="flex rounded-xl border border-default bg-input p-1 w-full sm:w-auto">
                                {(['all', 'parent', 'admin'] as const).map((r) => {
                                    return (
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
                                    );
                                })}
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
                                            user.is_admin ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400"
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
                                            Joined
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Facebook
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
                                                        user.is_admin ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400"
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
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
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
                                                <div className="flex items-center gap-1.5 text-sm text-body-muted">
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                </div>
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
        </div>
    );
}
