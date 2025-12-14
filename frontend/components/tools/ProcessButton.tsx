"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/Button"
import { Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessButtonProps extends ButtonProps {
    loading?: boolean
    label: string
}

export function ProcessButton({ loading, label, className, disabled, ...props }: ProcessButtonProps) {
    return (
        <div className="flex justify-center pt-4">
            <Button
                size="lg"
                className={cn("h-16 px-12 text-xl font-bold rounded-full shadow-lg shadow-blue-600/20 active:scale-95 transition-all", className)}
                disabled={loading || disabled}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        {label}
                        <ArrowRight className="ml-2 h-6 w-6" />
                    </>
                )}
            </Button>
        </div>
    )
}
