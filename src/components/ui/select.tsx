'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string | number;
    onChange?: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    className?: string;
    name?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
    ({ options, value, onChange, placeholder = 'Select an option', disabled = false, error = false, className, name }, ref) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
        const containerRef = React.useRef<HTMLDivElement>(null);
        const listRef = React.useRef<HTMLUListElement>(null);

        const selectedOption = options.find((opt) => opt.value === value);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        // Handle keyboard navigation
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (disabled) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen && highlightedIndex >= 0) {
                        const option = options[highlightedIndex];
                        if (!option.disabled) {
                            onChange?.(option.value);
                            setIsOpen(false);
                        }
                    } else {
                        setIsOpen(!isOpen);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                    } else {
                        setHighlightedIndex((prev) => {
                            const next = prev + 1;
                            return next >= options.length ? 0 : next;
                        });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                    } else {
                        setHighlightedIndex((prev) => {
                            const next = prev - 1;
                            return next < 0 ? options.length - 1 : next;
                        });
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    break;
                case 'Tab':
                    setIsOpen(false);
                    break;
            }
        };

        // Scroll highlighted item into view
        React.useEffect(() => {
            if (isOpen && listRef.current && highlightedIndex >= 0) {
                const item = listRef.current.children[highlightedIndex] as HTMLElement;
                if (item) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            }
        }, [highlightedIndex, isOpen]);

        // Reset highlighted index when opening
        React.useEffect(() => {
            if (isOpen) {
                const currentIndex = options.findIndex((opt) => opt.value === value);
                setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
        }, [isOpen, options, value]);

        return (
            <div ref={containerRef} className={cn('relative', className)}>
                {/* Hidden input for form compatibility */}
                <input type="hidden" name={name} value={value ?? ''} />
                
                {/* Trigger */}
                <button
                    ref={ref as React.Ref<HTMLButtonElement>}
                    type="button"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        'w-full h-12 px-4 py-2 text-left text-sm rounded-xl border bg-card transition-all',
                        'flex items-center justify-between gap-2',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        error
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-neutral-200 dark:border-neutral-700',
                        disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                >
                    <span className={cn(selectedOption ? 'text-heading' : 'text-body-muted')}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-body-muted transition-transform flex-shrink-0',
                            isOpen && 'rotate-180'
                        )}
                    />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <ul
                        ref={listRef}
                        role="listbox"
                        className={cn(
                            'absolute z-50 w-full mt-1 max-h-60 overflow-auto',
                            'rounded-xl border border-neutral-200 dark:border-neutral-700',
                            'bg-card shadow-lg list-none m-0 p-0',
                            'animate-in fade-in-0 zoom-in-95 duration-150'
                        )}
                    >
                        {options.length === 0 ? (
                            <li className="px-4 py-2 text-sm text-body-muted">No options available</li>
                        ) : (
                            options.map((option, index) => (
                                <li
                                    key={option.value}
                                    role="option"
                                    aria-selected={option.value === value}
                                    onClick={() => {
                                        if (!option.disabled) {
                                            onChange?.(option.value);
                                            setIsOpen(false);
                                        }
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={cn(
                                        'px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2',
                                        option.value === value && 'text-primary font-medium',
                                        highlightedIndex === index && 'bg-primary-50 dark:bg-primary-900/20',
                                        option.disabled && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className={cn('truncate', option.value === value && 'text-primary')}>
                                            {option.label}
                                        </div>
                                        {option.description && (
                                            <div className="text-xs text-body-muted truncate">{option.description}</div>
                                        )}
                                    </div>
                                    {option.value === value && (
                                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
