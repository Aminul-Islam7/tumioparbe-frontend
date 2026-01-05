'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    labelPosition?: 'left' | 'right';
    id?: string;
    className?: string;
}

export function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    labelPosition = 'left',
    id,
    className,
}: ToggleSwitchProps) {
    const sizeClasses = {
        sm: {
            track: 'w-8 h-4',
            thumb: 'w-3 h-3',
            translate: 'translate-x-[18px]',
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-[22px]',
        },
        lg: {
            track: 'w-14 h-7',
            thumb: 'w-6 h-6',
            translate: 'translate-x-[30px]',
        },
    };

    const currentSize = sizeClasses[size];

    const handleClick = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const switchElement = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            id={id}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
                'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                currentSize.track,
                checked
                    ? 'bg-primary'
                    : 'bg-neutral-300 dark:bg-neutral-600',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
                    currentSize.thumb,
                    checked ? currentSize.translate : 'translate-x-0.5',
                    'mt-0.5'
                )}
            />
        </button>
    );

    if (!label) {
        return switchElement;
    }

    return (
        <label className={cn(
            'flex items-center justify-between gap-2 cursor-pointer w-full',
            disabled && 'opacity-50 cursor-not-allowed',
            className
        )}>
            {labelPosition === 'left' && (
                <span className="text-sm font-medium text-heading select-none">{label}</span>
            )}
            {switchElement}
            {labelPosition === 'right' && (
                <span className="text-sm font-medium text-heading select-none">{label}</span>
            )}
        </label>
    );
}

export default ToggleSwitch;
