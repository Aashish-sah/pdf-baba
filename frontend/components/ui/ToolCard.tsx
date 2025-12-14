import Link from 'next/link';
import Image from 'next/image';
import { Card } from './Card';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ToolCardProps {
    title: string;
    description: string;
    category: string;
    icon: string; // Path to icon or component
    href: string;
    className?: string;
}

export function ToolCard({ title, description, category, icon, href, className }: ToolCardProps) {
    return (
        <Link href={href} className={cn("group block h-full", className)}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {/* Placeholder for icon if string, or render component */}
                        {/* For now assuming it's an image path or we use lucide icons mapped elsewhere */}
                        <img src={icon} alt={title} className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {category}
                    </span>
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                    {description}
                </p>

                <div className="mt-4 flex items-center text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                    Open Tool <ArrowRight className="ml-1 h-4 w-4" />
                </div>
            </div>
        </Link>
    );
}
