import {
    FileText, Merge, Split, Scan, Minimize2, Image, FileImage,
    Sheet, Globe, PenLine, RotateCw, Stamp, Lock, Unlock, PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";

const IconMap: Record<string, any> = {
    FileText, Merge, Split, Scan, Minimize2, Image, FileImage,
    Sheet, Globe, PenLine, RotateCw, Stamp, Lock, Unlock, PenTool
};

interface ToolIconProps {
    name: string;
    colorClass?: string;
    className?: string;
}

export function ToolIcon({ name, colorClass, className }: ToolIconProps) {
    // Check if name is an image path
    if (name.startsWith('/') || name.includes('.')) {
        return (
            <div className={cn("flex items-center justify-center rounded-lg shadow-sm overflow-hidden bg-transparent", className)}>
                {/* Maintain colorClass background if desired, or assume image handles it. 
                    Given the 'node' comment, maybe they want the card icon style. 
                    The existing icons are lucide icons on a colored bg.
                    If user provides a full color icon, we might not need the bg, or we render it on white?
                    Let's revert 'colorClass' on the div if image, or make it optional.
                */}
                <img src={name} alt="" className="w-full h-full object-contain p-3.5" />
            </div>
        );
    }

    const IconComponent = IconMap[name] || FileText; // Fallback

    return (
        <div className={cn("flex items-center justify-center rounded-lg shadow-sm text-white", colorClass, className)}>
            <IconComponent className="w-1/2 h-1/2" />
        </div>
    );
}
