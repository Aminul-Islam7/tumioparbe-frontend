import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-bubblegum hover:bg-primary-dark hover:shadow-bubblegum rounded-button',
                destructive:
                    'bg-error text-error-foreground shadow-button hover:bg-error-dark hover:shadow-button-hover rounded-button',
                outline:
                    'border-2 border-primary bg-transparent text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-button',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sky hover:bg-secondary-dark hover:shadow-sky rounded-button',
                ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-button',
                link: 'text-secondary underline-offset-4 hover:underline hover:text-secondary-dark',
                success:
                    'bg-success text-success-foreground shadow-button hover:bg-success-dark hover:shadow-button-hover rounded-button',
                warning:
                    'bg-warning text-warning-foreground shadow-button hover:bg-warning-dark hover:shadow-button-hover rounded-button',
                // Soft variants - subtle colored backgrounds
                'soft-primary':
                    'bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-button',
                'soft-secondary':
                    'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 rounded-button',
                'soft-success':
                    'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-button',
                'soft-warning':
                    'bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-button',
                'soft-error':
                    'bg-error-light text-error-dark hover:bg-primary-200 rounded-button',
                // Playful accent variants for kids
                sunny: 'bg-sunny-400 text-sunny-900 shadow-sunny hover:bg-sunny-500 rounded-button',
                tangerine:
                    'bg-tangerine-400 text-white shadow-tangerine hover:bg-tangerine-500 rounded-button',
                lavender:
                    'bg-lavender-400 text-white shadow-lavender hover:bg-lavender-500 rounded-button',
                lime: 'bg-lime-400 text-lime-900 shadow-lime hover:bg-lime-500 rounded-button',
                marine: 'bg-marine-400 text-white shadow-marine hover:bg-marine-500 rounded-button',
            },
            size: {
                xs: 'h-7 px-2.5 text-xs rounded-button-sm',
                sm: 'h-8 px-3 text-sm rounded-button-sm',
                default: 'h-10 px-5 text-sm',
                lg: 'h-12 px-8 text-base rounded-button-lg',
                xl: 'h-14 px-10 text-lg rounded-button-lg',
                icon: 'h-10 w-10 rounded-full',
                'icon-sm': 'h-8 w-8 rounded-full',
                'icon-lg': 'h-12 w-12 rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
