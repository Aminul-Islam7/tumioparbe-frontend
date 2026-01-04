'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    Users,
    ChevronRight,
    ChevronDown,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { courseApi } from '@/lib/api';
import { Course, Batch } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { adminApi } from '@/lib/adminApi';

// Course Form Modal Component
interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CourseFormData) => Promise<void>;
    initialData?: Course | null;
    isSubmitting: boolean;
}

interface CourseFormData {
    name: string;
    description: string;
    admission_fee: number;
    monthly_fee: number;
    is_active: boolean;
}

function CourseFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: CourseFormModalProps) {
    const [formData, setFormData] = useState<CourseFormData>({
        name: '',
        description: '',
        admission_fee: 0,
        monthly_fee: 0,
        is_active: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                admission_fee: initialData.admission_fee,
                monthly_fee: initialData.monthly_fee,
                is_active: initialData.is_active,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                admission_fee: 0,
                monthly_fee: 0,
                is_active: true,
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
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
                    {initialData ? 'Edit Course' : 'Add New Course'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Course Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter course name"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                            placeholder="Enter course description"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-heading mb-1">
                                Admission Fee (৳) *
                            </label>
                            <input
                                type="number"
                                value={formData.admission_fee}
                                onChange={(e) => setFormData({ ...formData, admission_fee: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-heading mb-1">
                                Monthly Fee (৳) *
                            </label>
                            <input
                                type="number"
                                value={formData.monthly_fee}
                                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-default bg-input focus:ring-2 focus:ring-primary/20"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-heading">
                            Course is active
                        </label>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : initialData ? (
                                'Save Changes'
                            ) : (
                                'Add Course'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Batch Form Modal Component
interface BatchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BatchFormData) => Promise<void>;
    initialData?: Batch | null;
    courseId: number;
    isSubmitting: boolean;
}

interface BatchFormData {
    name: string;
    timing: string;
    group_link: string;
    class_link: string;
    tuition_fee: number | null;
    is_visible: boolean;
}

function BatchFormModal({ isOpen, onClose, onSubmit, initialData, courseId, isSubmitting }: BatchFormModalProps) {
    const [formData, setFormData] = useState<BatchFormData>({
        name: '',
        timing: '',
        group_link: '',
        class_link: '',
        tuition_fee: null,
        is_visible: true,
    });
    const [useCourseFee, setUseCourseFee] = useState(true);

    useEffect(() => {
        if (initialData) {
            const hasBatchFee = initialData.tuition_fee !== null && initialData.tuition_fee !== undefined;
            setFormData({
                name: initialData.name,
                timing: initialData.timing,
                group_link: initialData.group_link || '',
                class_link: initialData.class_link || '',
                tuition_fee: initialData.tuition_fee ?? null,
                is_visible: initialData.is_visible,
            });
            setUseCourseFee(!hasBatchFee);
        } else {
            setFormData({
                name: '',
                timing: '',
                group_link: '',
                class_link: '',
                tuition_fee: null,
                is_visible: true,
            });
            setUseCourseFee(true);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData: BatchFormData = {
            ...formData,
            tuition_fee: useCourseFee ? null : formData.tuition_fee,
        };
        await onSubmit(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-heading mb-4">
                    {initialData ? 'Edit Batch' : 'Add New Batch'}
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
                            placeholder="e.g., Evening Batch A"
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
                            placeholder="e.g., Mon-Wed 5:00 PM - 6:30 PM"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-heading mb-1">
                            Group Link (WhatsApp/Telegram)
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
                            Class Link (Zoom/Meet)
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
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="use_course_fee"
                                checked={useCourseFee}
                                onChange={(e) => setUseCourseFee(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="use_course_fee" className="text-sm font-medium text-heading">
                                Use course-level tuition fee
                            </label>
                        </div>
                        
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
                                    placeholder="Enter batch-specific fee"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_visible"
                            checked={formData.is_visible}
                            onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                            className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_visible" className="text-sm font-medium text-heading">
                            Batch is visible to users
                        </label>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : initialData ? (
                                'Save Changes'
                            ) : (
                                'Add Batch'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    isDeleting: boolean;
}

function DeleteModal({ isOpen, onClose, onConfirm, title, message, isDeleting }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-heading">{title}</h2>
                </div>
                
                <p className="text-body-muted mb-6">{message}</p>
                
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Course Card Component
interface CourseCardProps {
    course: Course;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddBatch: () => void;
    onEditBatch: (batch: Batch) => void;
    onDeleteBatch: (batch: Batch) => void;
}

function CourseCard({ 
    course, 
    isExpanded, 
    onToggle, 
    onEdit, 
    onDelete,
    onAddBatch,
    onEditBatch,
    onDeleteBatch,
}: CourseCardProps) {
    const totalStudents = course.batches?.reduce((sum, b) => sum + (b.student_count || 0), 0) || 0;
    
    return (
        <div className={cn(
            'bg-card rounded-2xl border shadow-sm transition-all duration-300',
            course.is_active 
                ? 'border-secondary-200 dark:border-secondary-800' 
                : 'border-neutral-200 dark:border-neutral-700 opacity-75'
        )}>
            {/* Course Header */}
            <div 
                className="p-5 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={cn(
                            'p-3 rounded-xl shrink-0',
                            course.is_active 
                                ? 'bg-secondary-100 dark:bg-secondary-900/30' 
                                : 'bg-neutral-100 dark:bg-neutral-800'
                        )}>
                            <BookOpen className={cn(
                                'w-6 h-6',
                                course.is_active 
                                    ? 'text-secondary' 
                                    : 'text-neutral-500'
                            )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-heading truncate">
                                    {course.name}
                                </h3>
                                {!course.is_active && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            
                            {course.description && (
                                <p className="text-sm text-body-muted line-clamp-1 mb-2">
                                    {course.description}
                                </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-body-muted">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    {totalStudents} students
                                </span>
                                <span>•</span>
                                <span>{course.batches?.length || 0} batches</span>
                                <span>•</span>
                                <span>৳{course.admission_fee} admission</span>
                                <span>•</span>
                                <span>৳{course.monthly_fee}/month</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-body-muted hover:text-secondary transition-colors"
                            title="Edit course"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-body-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete course"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className={cn(
                            'p-1 rounded-lg transition-transform duration-300',
                            isExpanded && 'rotate-180'
                        )}>
                            <ChevronDown className="w-5 h-5 text-body-muted" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Batches Section */}
            {isExpanded && (
                <div className="border-t border-default p-4 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-b-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-heading text-sm">Batches</h4>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onAddBatch}
                            className="text-secondary hover:text-secondary-dark"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Batch
                        </Button>
                    </div>
                    
                    {course.batches && course.batches.length > 0 ? (
                        <div className="space-y-2">
                            {course.batches.map((batch) => (
                                <div
                                    key={batch.id}
                                    className={cn(
                                        'flex items-center justify-between p-3 rounded-xl border transition-colors',
                                        batch.is_visible
                                            ? 'bg-card border-lavender-200 dark:border-lavender-800'
                                            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-75'
                                    )}
                                >
                                    <Link
                                        href={`/admin/courses/${course.id}/batches/${batch.id}`}
                                        className="flex-1 min-w-0 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'flex items-center gap-1.5',
                                                !batch.is_visible && 'text-body-muted'
                                            )}>
                                                {batch.is_visible ? (
                                                    <Eye className="w-4 h-4 text-lavender-500" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 text-neutral-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-heading group-hover:text-secondary transition-colors truncate">
                                                        {batch.name}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-body-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-xs text-body-muted truncate">
                                                    {batch.timing} • {batch.student_count || 0} students
                                                    {batch.tuition_fee && ` • ৳${batch.tuition_fee}/month`}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    
                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                        <button
                                            onClick={() => onEditBatch(batch)}
                                            className="p-1.5 rounded-lg hover:bg-lavender-100 dark:hover:bg-lavender-900/30 text-body-muted hover:text-lavender-600 dark:hover:text-lavender-400 transition-colors"
                                            title="Edit batch"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteBatch(batch)}
                                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-body-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title="Delete batch"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-body-muted">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No batches yet</p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onAddBatch}
                                className="mt-2 text-secondary"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add your first batch
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Main Courses Page
export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
    
    // Course Modal State
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSavingCourse, setIsSavingCourse] = useState(false);
    
    // Batch Modal State
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [isSavingBatch, setIsSavingBatch] = useState(false);
    
    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ type: 'course' | 'batch'; id: number; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await courseApi.getCourses();
            // Handle both paginated response (results array) and direct array response
            const coursesData = response.data.results || response.data;
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (err: any) {
            console.error('Error fetching courses:', err);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const toggleCourse = (courseId: number) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseId)) {
                next.delete(courseId);
            } else {
                next.add(courseId);
            }
            return next;
        });
    };

    // Course CRUD handlers
    const handleAddCourse = () => {
        setEditingCourse(null);
        setCourseModalOpen(true);
    };

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setCourseModalOpen(true);
    };

    const handleDeleteCourse = (course: Course) => {
        setDeletingItem({ type: 'course', id: course.id, name: course.name });
        setDeleteModalOpen(true);
    };

    const handleCourseSubmit = async (data: CourseFormData) => {
        try {
            setIsSavingCourse(true);
            if (editingCourse) {
                await adminApi.updateCourse(editingCourse.id, data);
                toast.success('Course updated successfully');
            } else {
                await adminApi.createCourse(data);
                toast.success('Course created successfully');
            }
            setCourseModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            console.error('Error saving course:', err);
            toast.error(err.response?.data?.detail || 'Failed to save course');
        } finally {
            setIsSavingCourse(false);
        }
    };

    // Batch CRUD handlers
    const handleAddBatch = (courseId: number) => {
        setSelectedCourseId(courseId);
        setEditingBatch(null);
        setBatchModalOpen(true);
    };

    const handleEditBatch = (batch: Batch, courseId: number) => {
        setSelectedCourseId(courseId);
        setEditingBatch(batch);
        setBatchModalOpen(true);
    };

    const handleDeleteBatch = (batch: Batch) => {
        setDeletingItem({ type: 'batch', id: batch.id, name: batch.name });
        setDeleteModalOpen(true);
    };

    const handleBatchSubmit = async (data: BatchFormData) => {
        if (!selectedCourseId) return;
        
        try {
            setIsSavingBatch(true);
            if (editingBatch) {
                await adminApi.updateBatch(editingBatch.id, data);
                toast.success('Batch updated successfully');
            } else {
                await adminApi.createBatch({
                    ...data,
                    course: selectedCourseId,
                });
                toast.success('Batch created successfully');
            }
            setBatchModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            console.error('Error saving batch:', err);
            toast.error(err.response?.data?.detail || 'Failed to save batch');
        } finally {
            setIsSavingBatch(false);
        }
    };

    // Delete handler
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        
        try {
            setIsDeleting(true);
            if (deletingItem.type === 'course') {
                const response = await adminApi.deleteCourse(deletingItem.id);
                if (response.data?.message) {
                    toast.info(response.data.message);
                } else {
                    toast.success('Course deleted successfully');
                }
            } else {
                const response = await adminApi.deleteBatch(deletingItem.id);
                if (response.data?.message) {
                    toast.info(response.data.message);
                } else {
                    toast.success('Batch deleted successfully');
                }
            }
            setDeleteModalOpen(false);
            setDeletingItem(null);
            fetchCourses();
        } catch (err: any) {
            console.error('Error deleting:', err);
            toast.error(err.response?.data?.detail || `Failed to delete ${deletingItem.type}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter courses by search
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Add Course Button */}
            <div className="flex justify-end">
                <Button onClick={handleAddCourse}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                </Button>
            </div>

            {/* Courses List */}
            {courses.length > 0 ? (
                <div className="space-y-4">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            isExpanded={expandedCourses.has(course.id)}
                            onToggle={() => toggleCourse(course.id)}
                            onEdit={() => handleEditCourse(course)}
                            onDelete={() => handleDeleteCourse(course)}
                            onAddBatch={() => handleAddBatch(course.id)}
                            onEditBatch={(batch) => handleEditBatch(batch, course.id)}
                            onDeleteBatch={handleDeleteBatch}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-card rounded-2xl border border-default">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-body-subtle" />
                    <h3 className="text-lg font-semibold text-heading mb-2">
                        No courses yet
                    </h3>
                    <p className="text-body-muted mb-4">
                        Create your first course to get started
                    </p>
                    <Button onClick={handleAddCourse}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                    </Button>
                </div>
            )}

            {/* Modals */}
            <CourseFormModal
                isOpen={courseModalOpen}
                onClose={() => setCourseModalOpen(false)}
                onSubmit={handleCourseSubmit}
                initialData={editingCourse}
                isSubmitting={isSavingCourse}
            />

            {selectedCourseId && (
                <BatchFormModal
                    isOpen={batchModalOpen}
                    onClose={() => setBatchModalOpen(false)}
                    onSubmit={handleBatchSubmit}
                    initialData={editingBatch}
                    courseId={selectedCourseId}
                    isSubmitting={isSavingBatch}
                />
            )}

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeletingItem(null);
                }}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingItem?.type === 'course' ? 'Course' : 'Batch'}`}
                message={deletingItem?.type === 'course'
                    ? `Are you sure you want to delete "${deletingItem?.name}"? If there are enrolled students, the course will be marked as inactive instead.`
                    : `Are you sure you want to delete "${deletingItem?.name}"? If there are enrolled students, the batch will be marked as hidden instead.`
                }
                isDeleting={isDeleting}
            />
        </div>
    );
}
