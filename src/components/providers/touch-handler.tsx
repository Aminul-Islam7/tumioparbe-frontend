'use client';

import { useEffect, type ReactNode } from 'react';

interface TouchHandlerProps {
    children: ReactNode;
}

/**
 * TouchHandler helps fix hover effect issues on touch devices
 * by applying 'touch-device' class to the document body when on a touch device.
 * This component also prevents background transparency issues on touch.
 */
export function TouchHandler({ children }: TouchHandlerProps) {
    useEffect(() => {
        // Check if device supports touch
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
            // Add touch-device class to body for CSS targeting
            document.body.classList.add('touch-device');

            // Simplified touch feedback that preserves backgrounds
            const styleEl = document.createElement('style');
            styleEl.id = 'touch-fix-styles';
            styleEl.textContent = `
                /* Remove default tap highlight */
                .touch-device * {
                    -webkit-tap-highlight-color: transparent !important;
                    -webkit-touch-callout: none !important;
                }
                
                /* Minimal touch feedback without affecting backgrounds */
                .touch-device button:active,
                .touch-device a:active,
                .touch-device [role="button"]:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                    transition: transform 0.1s ease, opacity 0.1s ease !important;
                }
            `;
            document.head.appendChild(styleEl);

            // Function to reset any stuck hover states when scrolling
            const clearHoverOnScroll = () => {
                document.body.classList.add('touch-scrolling');
                clearTimeout(window.scrollTimeout);
                window.scrollTimeout = setTimeout(() => {
                    document.body.classList.remove('touch-scrolling');
                }, 100);
            };

            // Add scroll listener to clear any stuck hover states
            window.addEventListener('scroll', clearHoverOnScroll, { passive: true });

            return () => {
                window.removeEventListener('scroll', clearHoverOnScroll);
                document.body.classList.remove('touch-device');
                document.body.classList.remove('touch-scrolling');

                // Remove the style element
                const styleElement = document.getElementById('touch-fix-styles');
                if (styleElement) {
                    styleElement.remove();
                }
            };
        }
    }, []);

    // Return the children
    return <>{children}</>;
}
