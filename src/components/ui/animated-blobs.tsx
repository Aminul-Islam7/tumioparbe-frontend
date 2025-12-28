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
    // Disabled as per user request
    return null;

    /* Original implementation preserved below for reference
    const [init, setInit] = useState(false);
    // ... code ...
    */
}
