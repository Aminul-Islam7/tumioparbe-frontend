'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon, Stars } from 'lucide-react';

interface LightDarkSwitchProps {
    className?: string;
}

export default function LightDarkSwitch({ className }: LightDarkSwitchProps) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
        // Check if device supports touch
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    // Return placeholder with same dimensions while mounting
    if (!mounted) {
        return (
            <div className={`w-10 h-10 flex items-center justify-center ${className}`}>
                <div className="w-6 h-6" />
            </div>
        );
    }

    // Use resolvedTheme instead of theme to get the actual theme applied (including system preference)
    const isDarkMode = resolvedTheme === 'dark';

    const toggleTheme = () => {
        // Reset hover state on click to prevent it from getting stuck
        setIsHovered(false);
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    // Don't apply hover effects on touch devices
    const handleHoverStart = () => {
        if (!isTouchDevice) {
            setIsHovered(true);
        }
    };

    const handleHoverEnd = () => {
        setIsHovered(false);
    };

    const handleTouchStart = () => {
        // For touch devices, briefly show the hover state but don't keep it
        if (isTouchDevice) {
            setIsHovered(true);
        }
    };

    const handleTouchEnd = () => {
        // Clear hover state when touch ends
        if (isTouchDevice) {
            setIsHovered(false);
        }
    };

    return (
        <motion.button
            className={`relative flex items-center justify-center rounded-full cursor-pointer p-2 ${className}`}
            onClick={toggleTheme}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            whileTap={{ scale: 0.9 }}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r"
                initial={false}
                animate={{
                    // backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isHovered
                        ? isDarkMode
                            ? '0 0 8px 2px rgba(155, 93, 229, 0.7), inset 0 0 8px rgba(155, 93, 229, 0.4)'
                            : '0 0 8px 2px rgba(255, 112, 166, 0.7), inset 0 0 8px rgba(255, 112, 166, 0.4)'
                        : 'none',
                }}
                transition={{ type: 'tween', duration: 0.3 }}
            />

            <div className="relative h-6 w-6">
                {/* Sun */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDarkMode ? 0 : 1,
                        opacity: isDarkMode ? 0 : 1,
                        color: isHovered ? '#FF70A6' : '#FFD670', // Bubblegum on hover, Sunny Yellow default
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 10,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Sun className="h-5 w-5" strokeWidth={2} />
                </motion.div>

                {/* Moon and stars */}
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDarkMode ? 1 : 0,
                        opacity: isDarkMode ? 1 : 0,
                        color: isHovered ? '#9B5DE5' : '#70D6FF', // Purple on hover, Sky Blue default
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 10,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {isDarkMode ? (
                        <>
                            <motion.div
                                className="relative"
                                initial={false}
                                animate={{ rotate: isHovered ? [0, 15, -5, 0] : 0 }}
                                transition={{
                                    duration: 1.5,
                                    repeat: isHovered ? Infinity : 0,
                                    repeatType: 'loop',
                                }}
                            >
                                <Moon className="h-5 w-5" strokeWidth={2} />
                                <motion.div
                                    className="absolute -right-0.5 -top-0.5"
                                    animate={{
                                        scale: isHovered ? [1, 1.2, 1] : 1,
                                        opacity: isHovered ? [0.7, 1, 0.7] : 0.7,
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: isHovered ? Infinity : 0,
                                        repeatType: 'loop',
                                    }}
                                    style={{
                                        transformOrigin: 'center',
                                        transform: 'scale(0.8)',
                                    }}
                                >
                                    <Stars className="h-2 w-2 text-sunny" strokeWidth={2} />
                                </motion.div>
                            </motion.div>
                        </>
                    ) : (
                        <Moon className="h-5 w-5" strokeWidth={2} />
                    )}
                </motion.div>
            </div>
        </motion.button>
    );
}
