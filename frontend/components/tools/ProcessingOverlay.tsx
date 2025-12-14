"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingOverlayProps {
    isVisible: boolean
    progress?: number
    message?: string
    className?: string
}

export function ProcessingOverlay({ isVisible, progress, message = "Processing...", className }: ProcessingOverlayProps) {
    if (!isVisible) return null

    return (
        <div className={cn("mt-8 rounded-xl bg-blue-50 border border-blue-100 p-8 text-center dark:bg-blue-900/10 dark:border-blue-900/30 animate-in fade-in zoom-in-95 duration-300", className)}>
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {message} {progress !== undefined && `${progress}%`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your files are being processed securely. This usually takes a few seconds...
                    </p>
                </div>

                {progress !== undefined && (
                    <div className="w-full max-w-sm h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 mt-4">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
