"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OptionsPanelProps {
    title: string
    children: React.ReactNode
    className?: string
}

export function OptionsPanel({ title, children, className }: OptionsPanelProps) {
    return (
        <div className={cn("rounded-2xl bg-gray-50 border border-gray-200 p-6 dark:bg-gray-900/50 dark:border-gray-800", className)}>
            <h3 className="mb-4 text-base font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
}
