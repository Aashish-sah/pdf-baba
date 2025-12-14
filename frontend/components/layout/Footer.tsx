import Link from "next/link"
import { Facebook, Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-[#33333b] text-white pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="mb-6 flex items-center space-x-2">
                            <span className="text-3xl font-black tracking-tight text-[#e5322d]">
                                PDF<span className="text-white">Baba</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Your one-stop solution for all PDF operations. Secure, fast, and completely free.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github className="h-5 w-5" /></a>
                        </div>
                    </div>

                    {/* Columns */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">PDF Tools</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/tools/organize/merge" className="hover:text-white transition-colors">Merge PDF</Link></li>
                            <li><Link href="/tools/organize/split" className="hover:text-white transition-colors">Split PDF</Link></li>
                            <li><Link href="/tools/optimize/compress" className="hover:text-white transition-colors">Compress PDF</Link></li>
                            <li><Link href="/tools/convert/pdf-to-word" className="hover:text-white transition-colors">PDF to Word</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-6">Company</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-6">Support</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/contact" className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} PDF Baba. All rights reserved.
                    </p>
                    <div className="mt-4 md:mt-0">
                        <span className="text-sm text-gray-500">English</span>
                    </div>
                </div>
            </div >
        </footer >
    )
}
