'use client';

import { useState, useEffect } from 'react';

interface CompressOptionsProps {
    originalSizeKB: number;
    onTargetSizeChange: (sizeKB: number | null) => void;
}

export function CompressOptions({ originalSizeKB = 0, onTargetSizeChange }: CompressOptionsProps) {
    const [targetSize, setTargetSize] = useState<string>('');

    // Default: 50% of original
    const defaultTarget = Math.round(originalSizeKB * 0.5);

    const handleChange = (val: string) => {
        setTargetSize(val);
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
            onTargetSizeChange(num);
        } else {
            onTargetSizeChange(null); // Use default
        }
    };

    return (
        <div className="flex items-center justify-center gap-4">
            <span className="font-bold text-gray-700 text-lg">PDF Size:</span>
            <div className="relative">
                <input
                    type="number"
                    value={targetSize}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={`${defaultTarget}`}
                    className="w-32 px-3 py-2 border-2 border-blue-600 rounded-md text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <span className="font-bold text-gray-700 text-lg">Kb</span>
        </div>
    );
}
