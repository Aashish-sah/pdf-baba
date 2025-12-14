"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { useDropzone, type DropzoneOptions } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface UploadZoneProps {
    onFilesSelected: (files: File[]) => void
    accept?: Record<string, string[]>
    maxFiles?: number
    maxSize?: number // in bytes
    multiple?: boolean
    className?: string
}

export function UploadZone({
    onFilesSelected,
    accept = { "application/pdf": [".pdf"] },
    maxFiles = 10,
    maxSize = 100 * 1024 * 1024, // 100MB
    multiple = true,
    className,
}: UploadZoneProps) {

    const onDrop = React.useCallback(
        (acceptedFiles: File[]) => {
            onFilesSelected(acceptedFiles);
        },
        [onFilesSelected]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        maxSize,
        multiple,
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12 transition-all hover:bg-blue-50/50 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-blue-900/10 cursor-pointer",
                isDragActive && "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/10 scale-[1.01] shadow-lg",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {isDragActive ? "Drop files here" : "Select PDF files"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    or drop PDF files here
                </p>
            </div>

            {!isDragActive && (
                <div className="mt-8">
                    <Button size="lg" className="rounded-full px-8 text-base">
                        Choose Files
                    </Button>
                </div>
            )}
        </div>
    )
}
