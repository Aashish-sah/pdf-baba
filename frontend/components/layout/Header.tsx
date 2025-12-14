"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { TOOLS_CONFIG } from "@/lib/tools"
import { ToolIcon } from "@/components/ui/ToolIcon"
import { cn } from "@/lib/utils"

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false)
    const pathname = usePathname()

    // Group tools for the Mega Menu
    const organizeTools = Object.values(TOOLS_CONFIG).filter(t => t.category === 'organize');
    const optimizeTools = Object.values(TOOLS_CONFIG).filter(t => t.category === 'optimize');
    const convertTools = Object.values(TOOLS_CONFIG).filter(t => t.category === 'convert');
    const editTools = Object.values(TOOLS_CONFIG).filter(t => t.category === 'edit');
    const secureTools = Object.values(TOOLS_CONFIG).filter(t => t.category === 'secure');

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-3xl font-black tracking-tight text-[#e5322d]">
                        PDF<span className="text-[#33333b]">Baba</span>
                    </span>
                </Link>

                {/* DESKTOP NAV */}
                <nav className="hidden lg:flex items-center gap-8 h-full">

                    {/* MEGA MENU TRIGGER */}
                    <div
                        className="h-full flex items-center group relative cursor-pointer"
                        onMouseEnter={() => setIsToolsDropdownOpen(true)}
                        onMouseLeave={() => setIsToolsDropdownOpen(false)}
                    >
                        <Link href="/tools" className="flex items-center font-bold text-gray-700 hover:text-[#e5322d] transition-colors py-5">
                            ALL PDF TOOLS
                            <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                        </Link>

                        {/* DROPDOWN CONTENT */}
                        <div className={cn(
                            "absolute top-full left-1/2 -translate-x-1/2 w-[900px] bg-white shadow-xl rounded-b-xl border border-gray-100 p-8 grid grid-cols-4 gap-8 transition-all duration-200 opacity-0 invisible translate-y-2",
                            isToolsDropdownOpen && "opacity-100 visible translate-y-0"
                        )}>
                            {/* Column 1: Organize */}
                            <div className="space-y-4">
                                <h4 className="text-[#e5322d] font-bold uppercase text-sm tracking-wider mb-2">Organize PDF</h4>
                                {organizeTools.map(tool => (
                                    <Link key={tool.title} href={tool.href} className="flex items-center group/item">
                                        <ToolIcon name={tool.icon} colorClass={tool.color} className="w-6 h-6 rounded mr-3" />
                                        <span className="text-gray-600 font-medium group-hover/item:text-gray-900">{tool.title}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Column 2: Optimize */}
                            <div className="space-y-4">
                                <h4 className="text-green-600 font-bold uppercase text-sm tracking-wider mb-2">Optimize PDF</h4>
                                {optimizeTools.map(tool => (
                                    <Link key={tool.title} href={tool.href} className="flex items-center group/item">
                                        <ToolIcon name={tool.icon} colorClass={tool.color} className="w-6 h-6 rounded mr-3" />
                                        <span className="text-gray-600 font-medium group-hover/item:text-gray-900">{tool.title}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Column 3: Convert */}
                            <div className="space-y-4">
                                <h4 className="text-blue-600 font-bold uppercase text-sm tracking-wider mb-2">Convert PDF</h4>
                                {convertTools.map(tool => (
                                    <Link key={tool.title} href={tool.href} className="flex items-center group/item">
                                        <ToolIcon name={tool.icon} colorClass={tool.color} className="w-6 h-6 rounded mr-3" />
                                        <span className="text-gray-600 font-medium group-hover/item:text-gray-900">{tool.title}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Column 4: Edit & Secure */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-purple-600 font-bold uppercase text-sm tracking-wider mb-2">Edit PDF</h4>
                                    {editTools.map(tool => (
                                        <Link key={tool.title} href={tool.href} className="flex items-center group/item mb-3">
                                            <ToolIcon name={tool.icon} colorClass={tool.color} className="w-6 h-6 rounded mr-3" />
                                            <span className="text-gray-600 font-medium group-hover/item:text-gray-900">{tool.title}</span>
                                        </Link>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="text-slate-600 font-bold uppercase text-sm tracking-wider mb-2">Secure PDF</h4>
                                    {secureTools.map(tool => (
                                        <Link key={tool.title} href={tool.href} className="flex items-center group/item mb-3">
                                            <ToolIcon name={tool.icon} colorClass={tool.color} className="w-6 h-6 rounded mr-3" />
                                            <span className="text-gray-600 font-medium group-hover/item:text-gray-900">{tool.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* STANDARD LINKS */}
                    <Link href="/compress-pdf" className="font-bold text-gray-700 hover:text-[#e5322d]">COMPRESS PDF</Link>
                    <Link href="/pdf-to-word" className="font-bold text-gray-700 hover:text-[#e5322d]">PDF TO WORD</Link>
                    <Link href="/merge-pdf" className="font-bold text-gray-700 hover:text-[#e5322d]">MERGE PDF</Link>

                </nav>

                {/* RIGHT SIDE ACTIONS */}
                <div className="flex items-center gap-4">
                    {/* LOGIN / SIGNUP (Hidden for now as 'Free') */}
                    {/* Mobile Menu Button */}
                    <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 p-4 absolute w-full shadow-xl">
                    <div className="flex flex-col space-y-4">
                        <Link href="/tools" className="font-bold text-lg text-gray-800" onClick={() => setIsMenuOpen(false)}>All Tools</Link>
                        <Link href="/merge-pdf" className="font-medium text-gray-600" onClick={() => setIsMenuOpen(false)}>Merge PDF</Link>
                        <Link href="/compress-pdf" className="font-medium text-gray-600" onClick={() => setIsMenuOpen(false)}>Compress PDF</Link>
                    </div>
                </div>
            )}
        </header>
    )
}
