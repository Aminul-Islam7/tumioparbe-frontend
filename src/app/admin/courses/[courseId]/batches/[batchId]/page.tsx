'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Edit2,
    Search,
    Filter,
    Loader2,
    UserCircle,
    ChevronDown,
    ArrowRightLeft,
    XCircle,
    Calendar,
    DollarSign,
    MoreVertical,
    Check,
    X,
    Eye,
    EyeOff,
    ExternalLink,
    Settings,
    Lock,
    Unlock,
    Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { courseApi } from '@/lib/api';
import { adminApi, AdminEnrollmentDetails } from '@/lib/adminApi';
import { Course, Batch } from '@/types';
import { cn } from '@/lib/utils';


// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Fee type badge component
function FeeTypeBadge({ type }: { type: 'individual' | 'batch' | 'course' }) {
    const colors = {
        individual: 'bg-primary-100 dark:bg-primary-900/30 text-primary',
        batch: 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400',
        course: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary',
    };
    
    const labels = {
        individual: 'Individual',
        batch: 'Batch',
        course: 'Course',
    };
    
    return (
        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', colors[type])}>
            {labels[type]}
        </span>
    );
}

// Transfer Modal Component
interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (destinationBatchId: number, studentIds: number[]) => Promise<void>;
    selectedStudents: number[];
    currentBatchId: number;
    availableBatches: Batch[];
    isTransferring: boolean;
}

function TransferModal({ 
    isOpen, 
    onClose, 
    onTransfer, 
    selectedStudents, 
    currentBatchId, 
    availableBatches,
    isTransferring 
}: TransferModalProps) {
    const [destinationBatchId, setDestinationBatchId] = useState<number | null>(null);
    
    const otherBatches = availableBatches.filter(b => b.id !== currentBatchId);
    
    const handleTransfer = async () => {
        if (!destinationBatchId) {
            console.error('Please select a destination batch');
            return;
        }
        await onTransfer(destinationBatchId, selectedStudents);
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-heading mb-4">
                    Transfer Students
                </h2>
                
                <p className="text-body-muted mb-4">
                    Transfer {selectedStudents.length} student(s) to another batch in the same course.
                </p>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-heading mb-2">
                        Destination Batch
                    </label>
                    {otherBatches.length > 0 ? (
                        <select
                            value={destinationBatchId ?? ''}
                            onChange={(e) => setDestinationBatchId(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Select a batch...</option>
                            {otherBatches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name} ({batch.timing})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-body-muted text-sm italic">
                            No other batches available in this course.
                        </p>
                    )}
                </div>
                
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isTransferring}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleTransfer}
                        className="flex-1"
                        disabled={isTransferring || !destinationBatchId || otherBatches.length === 0}
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Transfer
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Edit Fee Modal Component
interface EditFeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fee: number | null) => Promise<void>;
    currentFee: number | null;
    enrollmentId: number;
    studentName: string;
    isSaving: boolean;
}

function EditFeeModal({ 
    isOpen, 
    onClose, 
    onSave, 
    currentFee, 
    studentName,
    isSaving 
}: EditFeeModalProps) {
    const [fee, setFee] = useState<string>('');
    const [useDefault, setUseDefault] = useState(currentFee === null);
    
    useEffect(() => {
        if (isOpen) {
            setFee(currentFee?.toString() ?? '');
            setUseDefault(currentFee === null);
        }
    }, [isOpen, currentFee]);
    
    const handleSave = async () => {
        const newFee = useDefault ? null : (fee ? Number(fee) : null);
        await onSave(newFee);
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-heading mb-2">
                    Edit Tuition Fee
                </h2>
                <p className="text-body-muted text-sm mb-4">
                    Set individual fee for {studentName}
                </p>
                
                <div className="space-y-4">
                    <ToggleSwitch
                        id="use_default"
                        checked={useDefault}
                        onChange={(checked) => setUseDefault(checked)}
                        label="Use batch/course default fee"
                    />
                    
                    {!useDefault && (
                        <div>
                            <label className="block text-sm font-medium text-heading mb-1">
                                Individual Fee (৳)
                            </label>
                            <input
                                type="number"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                min="0"
                                step="0.01"
                                placeholder="Enter fee amount"
                            />
                        </div>
                    )}
                </div>
                
                <div className="flex gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        className="flex-1"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Deactivate Enrollment Modal
interface DeactivateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    studentName: string;
    isDeactivating: boolean;
}

function DeactivateModal({ isOpen, onClose, onConfirm, studentName, isDeactivating }: DeactivateModalProps) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-heading">Deactivate Enrollment</h2>
                </div>
                
                <p className="text-body-muted mb-6">
                    Are you sure you want to deactivate {studentName}'s enrollment? 
                    They will no longer be part of this batch.
                </p>
                
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isDeactivating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        className="flex-1"
                        disabled={isDeactivating}
                    >
                        {isDeactivating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deactivating...
                            </>
                        ) : (
                            'Deactivate'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Batch Settings Modal
interface BatchSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BatchSettingsData) => Promise<void>;
    batch: Batch | null;
    isSaving: boolean;
}

interface BatchSettingsData {
    name: string;
    timing: string;
    group_link: string;
    class_link: string;
    tuition_fee: number | null;
    is_visible: boolean;
}

function BatchSettingsModal({ isOpen, onClose, onSave, batch, isSaving }: BatchSettingsModalProps) {
    const [formData, setFormData] = useState<BatchSettingsData>({
        name: '',
        timing: '',
        group_link: '',
        class_link: '',
        tuition_fee: null,
        is_visible: true,
    });
    const [useCourseFee, setUseCourseFee] = useState(true);
    
    useEffect(() => {
        if (batch && isOpen) {
            const hasBatchFee = batch.tuition_fee !== null && batch.tuition_fee !== undefined;
            setFormData({
                name: batch.name,
                timing: batch.timing,
                group_link: batch.group_link || '',
                class_link: batch.class_link || '',
                tuition_fee: batch.tuition_fee ?? null,
                is_visible: batch.is_visible,
            });
            setUseCourseFee(!hasBatchFee);
        }
    }, [batch, isOpen]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            ...formData,
            tuition_fee: useCourseFee ? null : formData.tuition_fee,
        });
    };
    
    if (!isOpen || !batch) return null;
    
    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-heading mb-4">
                    Batch Settings
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Batch Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Timing *
                        </label>
                        <input
                            type="text"
                            value={formData.timing}
                            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Group Link
                        </label>
                        <input
                            type="url"
                            value={formData.group_link}
                            onChange={(e) => setFormData({ ...formData, group_link: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="https://..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Class Link
                        </label>
                        <input
                            type="url"
                            value={formData.class_link}
                            onChange={(e) => setFormData({ ...formData, class_link: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="https://..."
                        />
                    </div>
                    
                    <div>
                        <ToggleSwitch
                            id="batch_use_course_fee"
                            checked={useCourseFee}
                            onChange={(checked) => setUseCourseFee(checked)}
                            label="Use course-level tuition fee"
                        />
                        
                        {!useCourseFee && (
                            <div>
                                <label className="block text-sm font-medium text-heading mb-1">
                                    Batch Tuition Fee (৳)
                                </label>
                                <input
                                    type="number"
                                    value={formData.tuition_fee ?? ''}
                                    onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4">
                        <ToggleSwitch
                            id="batch_is_visible"
                            checked={formData.is_visible}
                            onChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                            label="Open for enrollment"
                        />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Student Row Actions Dropdown
interface StudentActionsProps {
    enrollment: AdminEnrollmentDetails;
    onEditFee: () => void;
    onTransfer: () => void;
    onDeactivate: () => void;
    index?: number;
    totalCount?: number;
}

function StudentActions({ enrollment, onEditFee, onTransfer, onDeactivate, index = 0, totalCount = 0 }: StudentActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Show dropdown above if in the last 3 rows
    const showAbove = totalCount > 0 && index >= totalCount - 3;
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-body-muted transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-dropdown"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={cn(
                        "absolute right-0 z-dropdown bg-card rounded-xl border border-default shadow-xl py-1 w-64",
                        showAbove ? "bottom-full mb-1" : "top-full mt-1"
                    )}>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onEditFee();
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                            <DollarSign className="w-4 h-4" />
                            Edit Fee
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onTransfer();
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Transfer to another batch
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onDeactivate();
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Deactivate
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// Main Batch Detail Page
export default function BatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = Number(params.courseId);
    const batchId = Number(params.batchId);
    
    const [batch, setBatch] = useState<Batch | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [enrollments, setEnrollments] = useState<AdminEnrollmentDetails[]>([]);
    const [allBatches, setAllBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'enrollment_date' | 'fee'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Modals
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
    const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    
    const [selectedEnrollment, setSelectedEnrollment] = useState<AdminEnrollmentDetails | null>(null);
    
    // Loading states
    const [isTransferring, setIsTransferring] = useState(false);
    const [isSavingFee, setIsSavingFee] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch course to get all batches
            const courseResponse = await courseApi.getCourse(courseId);
            setCourse(courseResponse.data);
            setAllBatches(courseResponse.data.batches || []);
            
            // Find the specific batch
            const batchData = courseResponse.data.batches?.find(b => b.id === batchId);
            if (batchData) {
                setBatch(batchData);
            } else {
                // Fetch batch separately if not in course data
                const batchResponse = await adminApi.getBatch(batchId);
                setBatch(batchResponse.data);
            }
            
            // Fetch enrolled students
            const studentsResponse = await adminApi.getBatchStudents(batchId);
            setEnrollments(studentsResponse.data || []);
            
        } catch (err: any) {
            console.error('Failed to load batch data:', err);
        } finally {
            setLoading(false);
        }
    }, [courseId, batchId]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Filter and sort enrollments
    const filteredEnrollments = useMemo(() => {
        let result = [...enrollments];
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.student.name.toLowerCase().includes(query) ||
                e.student.parent.name.toLowerCase().includes(query) ||
                e.student.parent.phone.includes(query)
            );
        }
        
        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.student.name.localeCompare(b.student.name);
                    break;
                case 'enrollment_date':
                    comparison = new Date(a.earliest_enrollment_month).getTime() - new Date(b.earliest_enrollment_month).getTime();
                    break;
                case 'fee':
                    comparison = (a.effective_tuition_fee || 0) - (b.effective_tuition_fee || 0);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return result;
    }, [enrollments, searchQuery, sortBy, sortOrder]);
    

    // Action handlers
    const handleTransfer = async (destinationBatchId: number, studentIds: number[]) => {
        try {
            setIsTransferring(true);
            await adminApi.transferStudents(batchId, { destination_batch_id: destinationBatchId, student_ids: studentIds });
            setTransferModalOpen(false);
            setSelectedEnrollment(null);
            fetchData();
        } catch (err: any) {
            console.error('Error transferring students:', err);
        } finally {
            setIsTransferring(false);
        }
    };
    
    const handleSaveFee = async (fee: number | null) => {
        if (!selectedEnrollment) return;
        
        try {
            setIsSavingFee(true);
            await adminApi.updateEnrollmentFee(selectedEnrollment.id, { tuition_fee: fee });
            setEditFeeModalOpen(false);
            setSelectedEnrollment(null);
            fetchData();
        } catch (err: any) {
            console.error('Error updating fee:', err);
        } finally {
            setIsSavingFee(false);
        }
    };
    
    const handleDeactivate = async () => {
        if (!selectedEnrollment) return;
        
        try {
            setIsDeactivating(true);
            await adminApi.deactivateEnrollment(selectedEnrollment.id);
            setDeactivateModalOpen(false);
            setSelectedEnrollment(null);
            fetchData();
        } catch (err: any) {
            console.error('Error deactivating enrollment:', err);
        } finally {
            setIsDeactivating(false);
        }
    };
    
    const handleSaveSettings = async (data: BatchSettingsData) => {
        try {
            setIsSavingSettings(true);
            await adminApi.updateBatch(batchId, data);
            setSettingsModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Error updating batch:', err);
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Toggle enrollment status
    const handleToggleEnrollment = async () => {
        if (!batch) return;
        try {
            await adminApi.updateBatch(batchId, {
                ...batch,
                is_visible: !batch.is_visible,
            });
            fetchData();
        } catch (err: any) {
            console.error('Error toggling enrollment:', err);
        }
    };
    
    // Copy link handler
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // Link copied
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }
    
    if (!batch || !course) {
        return (
            <div className="text-center py-12">
                <p className="text-body-muted">Batch not found</p>
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/courses')}
                    className="mt-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Courses
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Breadcrumb and Header */}
            <div>
                <Link
                    href="/admin/courses"
                    className="inline-flex items-center gap-2 text-sm text-body-muted hover:text-primary transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </Link>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-heading">{batch.name}</h1>
                            {batch.is_visible ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                    <Unlock className="w-3 h-3" />
                                    Open
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                                    <Lock className="w-3 h-3" />
                                    Closed
                                </span>
                            )}
                        </div>
                        <p className="text-body-muted">
                            {course.name}
                        </p>
                    </div>
                    
                    {/* Desktop: Links and Settings */}
                    {/* Desktop: Links and Settings */}
                    <div className="hidden sm:flex items-center gap-2">
                        {batch.group_link && (
                            <div className="flex items-center rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden">
                                <a
                                    href={batch.group_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 active:scale-[0.98] transition-all border-r border-emerald-200 dark:border-emerald-800"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Group
                                </a>
                                <button
                                    onClick={() => handleCopy(batch.group_link || '', 'Group link')}
                                    className="flex items-center gap-1.5 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 active:scale-[0.98] transition-all"
                                    title="Copy group link"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-sm font-medium">Link</span>
                                </button>
                            </div>
                        )}
                        {batch.class_link && (
                            <div className="flex items-center rounded-lg border border-secondary/20 bg-secondary-50 dark:bg-secondary-900/20 overflow-hidden">
                                <a
                                    href={batch.class_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-secondary text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-900/30 active:bg-secondary-200 dark:active:bg-secondary-900/50 active:scale-[0.98] transition-all border-r border-secondary/20"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Class
                                </a>
                                <button
                                    onClick={() => handleCopy(batch.class_link || '', 'Class link')}
                                    className="flex items-center gap-1.5 px-3 py-2 text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-900/30 active:bg-secondary-200 dark:active:bg-secondary-900/50 active:scale-[0.98] transition-all"
                                    title="Copy class link"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-sm font-medium">Link</span>
                                </button>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setSettingsModalOpen(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-default p-4">
                    <p className="text-sm text-body-muted mb-1">Timing</p>
                    <p className="text-lg font-semibold text-heading">{batch.timing}</p>
                </div>
                <div className="bg-card rounded-xl border border-default p-4">
                    <p className="text-sm text-body-muted mb-1">Students</p>
                    <p className="text-2xl font-bold text-heading">{enrollments.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-default p-4">
                    <p className="text-sm text-body-muted mb-1">Monthly Fee</p>
                    <p className="text-2xl font-bold text-heading">৳{Math.round(batch.tuition_fee || course.monthly_fee)}</p>
                </div>
                <button
                    onClick={handleToggleEnrollment}
                    className="bg-card rounded-xl border border-default p-4 text-left hover:border-primary/30 transition-colors group"
                >
                    <p className="text-sm text-body-muted mb-1">Enrollment</p>
                    <div className="flex items-center gap-2">
                        {batch.is_visible ? (
                            <>
                                <Unlock className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                                <span className="text-lg font-semibold text-emerald-600">Open</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                                <span className="text-lg font-semibold text-amber-600">Closed</span>
                            </>
                        )}
                    </div>
                </button>                
            </div>

            {/* Mobile: Links and Settings Button */}
            {/* Mobile: Links and Settings Button */}
            <div className="sm:hidden flex flex-col gap-3">
                <div className="flex gap-2">
                    {batch.group_link && (
                        <div className="flex-1 flex rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden">
                            <a
                                href={batch.group_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 active:scale-[0.98] transition-all border-r border-emerald-200 dark:border-emerald-800"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Group
                            </a>
                            <button
                                onClick={() => handleCopy(batch.group_link || '', 'Group link')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 active:scale-[0.98] transition-all"
                                title="Copy group link"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">Link</span>
                            </button>
                        </div>
                    )}
                    {batch.class_link && (
                        <div className="flex-1 flex rounded-lg border border-secondary/20 bg-secondary-50 dark:bg-secondary-900/20 overflow-hidden">
                            <a
                                href={batch.class_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-secondary text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-900/30 active:bg-secondary-200 dark:active:bg-secondary-900/50 active:scale-[0.98] transition-all border-r border-secondary/20"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Class
                            </a>
                            <button
                                onClick={() => handleCopy(batch.class_link || '', 'Class link')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-900/30 active:bg-secondary-200 dark:active:bg-secondary-900/50 active:scale-[0.98] transition-all"
                                title="Copy class link"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">Link</span>
                            </button>
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSettingsModalOpen(true)}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
            </div>
            
            {/* Student List Card */}
            <div className="bg-card rounded-2xl border border-default shadow-sm overflow-hidden">
                {/* Search and Filters */}
                <div className="p-4 border-b border-default">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-body-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search students or parents..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 text-sm"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="enrollment_date">Sort by Enrollment</option>
                                <option value="fee">Sort by Fee</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-2.5 rounded-xl border border-default bg-input hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <ChevronDown className={cn(
                                    'w-5 h-5 transition-transform',
                                    sortOrder === 'asc' && 'rotate-180'
                                )} />
                            </button>
                        </div>
                    </div>
                    

                </div>
                
                {/* Student List - Compact cards on mobile, Table on desktop */}
                {filteredEnrollments.length > 0 ? (
                    <>
                        {/* Mobile View - Compact List */}
                        <div className="md:hidden divide-y divide-default">
                            {filteredEnrollments.map((enrollment, index) => (
                                <div key={enrollment.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <Link
                                                    href={`/admin/students/${enrollment.student.id}`}
                                                    className="flex-1 min-w-0 group"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                            <UserCircle className="h-5 w-5 text-lavender-600 dark:text-lavender-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm text-heading group-hover:text-primary transition-colors">
                                                                {enrollment.student.name}
                                                            </p>
                                                            <p className="text-xs text-body-muted">
                                                                {enrollment.student.parent.name} • {enrollment.student.parent.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="flex items-start gap-1 shrink-0">
                                                    <div className="text-right">
                                                        <p className="font-semibold text-sm text-heading">৳{Math.round(enrollment.effective_tuition_fee)}</p>
                                                        <FeeTypeBadge type={enrollment.fee_type} />
                                                    </div>
                                                    <StudentActions
                                                        enrollment={enrollment}
                                                        onEditFee={() => {
                                                            setSelectedEnrollment(enrollment);
                                                            setEditFeeModalOpen(true);
                                                        }}
                                                        onTransfer={() => {
                                                            setSelectedEnrollment(enrollment);
                                                            setTransferModalOpen(true);
                                                        }}
                                                        onDeactivate={() => {
                                                            setSelectedEnrollment(enrollment);
                                                            setDeactivateModalOpen(true);
                                                        }}
                                                        index={index}
                                                        totalCount={filteredEnrollments.length}
                                                    />
                                                </div>
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
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Parent
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider">
                                            Fee
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-body-muted uppercase tracking-wider hidden lg:table-cell">
                                            Enrolled
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-body-muted uppercase tracking-wider w-16">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {filteredEnrollments.map((enrollment, index) => (
                                        <tr key={enrollment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">

                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/students/${enrollment.student.id}`}
                                                    className="group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center shrink-0">
                                                            <UserCircle className="h-6 w-6 text-lavender-600 dark:text-lavender-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-heading group-hover:text-primary transition-colors">
                                                                {enrollment.student.name}
                                                            </p>
                                                            <p className="text-xs text-body-muted">
                                                                {calculateAge(enrollment.student.date_of_birth)} years old
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/users/${enrollment.student.parent.id}`}
                                                    className="text-heading hover:text-primary transition-colors"
                                                >
                                                    {enrollment.student.parent.name}
                                                </Link>
                                                <p className="text-xs text-body-muted">
                                                    {enrollment.student.parent.phone}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-heading">
                                                        ৳{Math.round(enrollment.effective_tuition_fee)}
                                                    </span>
                                                    <FeeTypeBadge type={enrollment.fee_type} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell text-body-muted text-sm">
                                                {new Date(enrollment.earliest_enrollment_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <StudentActions
                                                    enrollment={enrollment}
                                                    onEditFee={() => {
                                                        setSelectedEnrollment(enrollment);
                                                        setEditFeeModalOpen(true);
                                                    }}
                                                    onTransfer={() => {
                                                        setSelectedEnrollment(enrollment);
                                                        setTransferModalOpen(true);
                                                    }}
                                                    onDeactivate={() => {
                                                        setSelectedEnrollment(enrollment);
                                                        setDeactivateModalOpen(true);
                                                    }}
                                                    index={index}
                                                    totalCount={filteredEnrollments.length}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 text-body-subtle" />
                        <h3 className="text-lg font-semibold text-heading mb-2">
                            {searchQuery ? 'No students found' : 'No students enrolled'}
                        </h3>
                        <p className="text-body-muted">
                            {searchQuery 
                                ? 'Try adjusting your search query'
                                : 'Students will appear here once they enroll in this batch'
                            }
                        </p>
                    </div>
                )}
            </div>
            
            {/* Modals */}
            <TransferModal
                isOpen={transferModalOpen}
                onClose={() => {
                    setTransferModalOpen(false);
                    setSelectedEnrollment(null);
                }}
                onTransfer={handleTransfer}
                selectedStudents={selectedEnrollment ? [selectedEnrollment.student.id] : []}
                currentBatchId={batchId}
                availableBatches={allBatches}
                isTransferring={isTransferring}
            />
            
            <EditFeeModal
                isOpen={editFeeModalOpen}
                onClose={() => {
                    setEditFeeModalOpen(false);
                    setSelectedEnrollment(null);
                }}
                onSave={handleSaveFee}
                currentFee={selectedEnrollment?.tuition_fee ?? null}
                enrollmentId={selectedEnrollment?.id ?? 0}
                studentName={selectedEnrollment?.student.name ?? ''}
                isSaving={isSavingFee}
            />
            
            <DeactivateModal
                isOpen={deactivateModalOpen}
                onClose={() => {
                    setDeactivateModalOpen(false);
                    setSelectedEnrollment(null);
                }}
                onConfirm={handleDeactivate}
                studentName={selectedEnrollment?.student.name ?? ''}
                isDeactivating={isDeactivating}
            />
            
            <BatchSettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                onSave={handleSaveSettings}
                batch={batch}
                isSaving={isSavingSettings}
            />
        </div>
    );
}
