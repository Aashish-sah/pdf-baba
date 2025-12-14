"use client"

import * as React from "react"
import { FileIcon, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileListProps {
    files: File[]
    onRemove: (index: number) => void
    className?: string
}

export function FileList({ files, onRemove, className }: FileListProps) {
    if (files.length === 0) return null

    return (
        <div className={cn("space-y-3", className)}>
            {files.map((file, index) => (
                <div
                    key={`${file.name}-${index}`}
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                {file.name}
                            </p>
                            <p className="flex items-center text-xs text-gray-500">
                                <Info className="mr-1 h-3 w-3" />
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(index)
                        }}
                        className="flex-shrink-0 ml-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                        title="Remove file"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            ))}
        </div>
    )
}
