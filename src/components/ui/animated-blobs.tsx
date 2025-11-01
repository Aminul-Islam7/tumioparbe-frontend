'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine';
import { useTheme } from 'next-themes';

// Primary colors from color palette
const COLORS = [
    '#DE0000', // TP Red
    '#FF70A6', // Bubblegum Pink
    '#70D6FF', // Sky Blue
    '#FFD670', // Sunny Yellow
    '#89FC00', // Lime Green
    '#9B5DE5', // Electric Purple
    '#BD10E0',
    '#B8E986',
    '#50E3C2',
    '#FFD300',
    '#E86363',
];

export function AnimatedBlobs() {
    const [init, setInit] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    // Re-initialize when theme changes
    useEffect(() => {
        if (init) {
            const container = document.getElementById('tsparticles') as HTMLElement;
            if (container) {
                // Force refresh of particles when theme changes
                container.style.opacity = '0';
                setTimeout(() => {
                    container.style.opacity = '1';
                }, 100);
            }
        }
    }, [isDarkMode, init]);

    const options: ISourceOptions = {
        fullScreen: {
            enable: true,
            zIndex: -1,
        },
        particles: {
            number: {
                value: 15,
                density: {
                    enable: true,
                },
            },
            color: {
                value: COLORS,
            },
            shape: {
                type: 'circle',
            },
            opacity: {
                value: { min: 0.6, max: 0.8 },
            },
            size: {
                value: { min: 20, max: 120 },
            },
            move: {
                enable: true,
                speed: 3,
                direction: 'none',
                random: true,
                straight: false,
                // outModes: {
                //     default: 'bounce',
                // },
            },
        },
        interactivity: {
            detectsOn: 'window',
            events: {
                onHover: {
                    enable: true,
                    mode: 'bubble',
                },
            },
            modes: {
                bubble: {
                    distance: 300,
                    size: 10,
                    duration: 1,
                    opacity: 0.4,
                    speed: 2,
                },
            },
        },
        detectRetina: true,
        background: {
            color: 'transparent',
        },

        style: {
            filter: 'blur(25px)',
            opacity: isDarkMode ? '0.3' : '0.6',
        },
    };

    if (init) {
        return (
            <Particles
                id="tsparticles"
                options={options}
                className="fixed inset-0 pointer-events-none"
            />
        );
    }

    return null;
}
