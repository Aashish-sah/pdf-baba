import { ToolIcon } from "@/components/ui/ToolIcon";
import { TOOLS_CONFIG } from "@/lib/tools";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "organize", name: "Organize PDF" },
    { id: "optimize", name: "Optimize PDF" },
    { id: "convert", name: "Convert PDF" },
    { id: "edit", name: "Edit PDF" },
    { id: "secure", name: "Secure PDF" },
];

export default function AllToolsPage() {
    const tools = Object.values(TOOLS_CONFIG);

    return (
        <div className="bg-white min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-[#33333b] mb-4">All PDF Tools</h1>
                    <p className="text-xl text-[#47474f]">Make your life easier with our PDF toolset.</p>
                </div>

                <div className="space-y-16">
                    {CATEGORIES.map((category) => {
                        const categoryTools = tools.filter(t => t.category === category.id);
                        if (categoryTools.length === 0) return null;

                        return (
                            <div key={category.id}>
                                <div className="flex items-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                                        {category.name}
                                    </h2>
                                    <div className="flex-1 ml-6 h-px bg-gray-200" />
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {categoryTools.map((tool) => (
                                        <Link
                                            key={tool.title}
                                            href={tool.href}
                                            className="flex items-start p-6 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                        >
                                            <ToolIcon
                                                name={tool.icon}
                                                colorClass={tool.color}
                                                className="w-12 h-12 rounded-lg flex-shrink-0 mr-4"
                                            />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-1">{tool.title}</h3>
                                                <p className="text-sm text-gray-500 leading-snug">
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
