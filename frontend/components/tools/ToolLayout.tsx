"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToolLayoutProps {
    title: string
    description: string
    category?: string
    children: React.ReactNode
    className?: string
}

export function ToolLayout({
    title,
    description,
    category,
    children,
    className,
}: ToolLayoutProps) {
    return (
        <div className={cn("container mx-auto max-w-5xl px-4 py-12 md:px-6", className)}>
            <div className="mb-10 text-center">
                <h1 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                    {title}
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    {description}
                </p>
            </div>

            <div className="mx-auto max-w-4xl space-y-8">
                {children}
            </div>
        </div>
    )
}
