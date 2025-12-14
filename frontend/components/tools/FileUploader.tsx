"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void
    multiple?: boolean
    accept?: Record<string, string[]>
}

export function FileUploader({ onFilesSelected, multiple = true, accept }: FileUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            onFilesSelected(acceptedFiles)
        }
    }, [onFilesSelected])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple,
        accept,
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "flex flex-col items-center justify-center w-full h-80 rounded-2xl border-4 border-dashed transition-all cursor-pointer bg-white/50 backdrop-blur-sm",
                isDragActive
                    ? "border-[#e5322d] bg-red-50/50 scale-[1.02]"
                    : "border-gray-200 hover:border-[#e5322d] hover:bg-red-50/10"
            )}
        >
            <input {...getInputProps()} />

            <div className="bg-[#e5322d] w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-red-500/20 transition-transform group-hover:scale-110">
                <Upload className="w-10 h-10 text-white" />
            </div>

            <button className="bg-[#e5322d] text-white font-bold py-4 px-12 rounded-xl text-xl hover:bg-[#d42d29] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Select PDF files
            </button>

            <p className="mt-6 text-gray-500 font-medium">
                {isDragActive ? "Drop files here..." : "or drop PDFs here"}
            </p>
        </div>
    )
}
