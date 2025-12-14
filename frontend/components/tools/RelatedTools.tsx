"use client"

import Link from "next/link"
import { TOOLS_CONFIG, type ToolId } from "@/lib/tools"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/Button"

interface RelatedToolsProps {
    currentTool: ToolId
    className?: string
}

export function RelatedTools({ currentTool, className }: RelatedToolsProps) {
    const currentCategory = TOOLS_CONFIG[currentTool].category

    // Find other tools in same category, excluding current
    const related = Object.entries(TOOLS_CONFIG)
        .filter(([key, config]) => config.category === currentCategory && key !== currentTool)
        .slice(0, 3)

    if (related.length === 0) return null

    return (
        <div className={cn("mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center", className)}>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Related Tools
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                {related.map(([key, config]) => (
                    <Link
                        key={key}
                        href={config.href || '#'}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
                    >
                        {config.title}
                    </Link>
                ))}
            </div>
        </div>
    )
}
