"use client"

import * as React from "react"
import { Upload, FileIcon, X } from "lucide-react"
import { useDropzone, type DropzoneOptions } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void
    accept?: Record<string, string[]>
    maxFiles?: number
    maxSize?: number // in bytes
    className?: string
}

export function FileUpload({
    onFilesSelected,
    accept = { "application/pdf": [".pdf"] },
    maxFiles = 1,
    maxSize = 100 * 1024 * 1024, // 100MB
    className,
}: FileUploadProps) {
    const [files, setFiles] = React.useState<File[]>([])

    const onDrop = React.useCallback(
        (acceptedFiles: File[]) => {
            setFiles((prev) => {
                const newFiles = [...prev, ...acceptedFiles].slice(0, maxFiles);
                onFilesSelected(newFiles);
                return newFiles;
            })
        },
        [maxFiles, onFilesSelected]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        maxSize,
    })

    // We need to install react-dropzone: npm install react-dropzone

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            onFilesSelected(newFiles);
            return newFiles;
        })
    }

    return (
        <div className={cn("w-full max-w-xl mx-auto", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800/50 cursor-pointer",
                    isDragActive && "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/10"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Upload className="h-10 w-10" />
                </div>
                <div className="mt-6 text-center">
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {isDragActive ? "Drop files here" : "Select PDF files"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        or drop PDF files here
                    </p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-6 space-y-3">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    <FileIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent dropzone click
                                    removeFile(index);
                                }}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
