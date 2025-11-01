import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Import directly from the public directory
import logoPng from '../../../public/logo.png';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className }) => {
    const dimensions = {
        small: { width: 40, height: 40 },
        medium: { width: 70, height: 70 },
        large: { width: 80, height: 80 },
    };

    const { width, height } = dimensions[size];

    return (
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <Image
                src={logoPng}
                alt="Logo"
                width={width}
                height={height}
                className="transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col mt-2">
                <span className="font-bold text-sm sm:text-base md:text-lg xl:text-xl leading-[1.1] transition-colors text-tp_red group-hover:text-tp_red/90 font-bengali">
                    শিশু-কিশোর
                </span>
                <span className="font-bold text-sm sm:text-base md:text-lg xl:text-xl leading-[1.1] transition-colors text-tp_red group-hover:text-tp_red/90 font-bengali">
                    পারফর্মিং প্ল্যাটফর্ম
                </span>
            </div>
        </Link>
    );
};

export default Logo;
