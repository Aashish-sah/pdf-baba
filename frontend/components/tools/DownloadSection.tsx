"use client"

import * as React from "react"
import { Download, RotateCcw, CheckCircle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface DownloadSectionProps {
    isVisible: boolean
    fileName: string
    fileSize?: string
    downloadUrl: string
    onTryAnother?: () => void
    className?: string
}

export function DownloadSection({ isVisible, fileName, fileSize, downloadUrl, onTryAnother, className }: DownloadSectionProps) {
    if (!isVisible) return null

    return (
        <div className={cn("mt-8 p-8 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/50 max-w-lg mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
            <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-8 ring-green-50 dark:ring-green-900/10">
                    <CheckCircle className="h-10 w-10" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Your file is ready!
            </h2>

            <div className="mb-8 p-4 bg-white dark:bg-black/20 rounded-xl border border-green-100 dark:border-green-900/30 inline-flex items-center space-x-3 max-w-full">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg dark:bg-gray-800">
                    <span className="text-base">📄</span>
                </div>
                <div className="text-left min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {fileName}
                    </p>
                    {fileSize && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fileSize} • Processed just now
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <a
                    href={downloadUrl}
                    download={fileName}
                    className={buttonVariants({ size: "lg", className: "w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" })}
                >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </a>

                {onTryAnother && (
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        onClick={onTryAnother}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Another Tool
                    </Button>
                )}
            </div>
        </div>
    )
}
