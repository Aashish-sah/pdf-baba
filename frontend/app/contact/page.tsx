import Link from "next/link"
import { Mail, MessageSquare, Briefcase, Twitter, Facebook, Github, Linkedin } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-16 md:px-6 max-w-5xl">
                <div className="text-center mb-16">
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#33333b] sm:text-5xl">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-[#47474f] max-w-2xl mx-auto">
                        Have questions, feedback, or partnership inquiries? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 mb-20">
                    {/* Support */}
                    <Link href="mailto:support@pdfbaba.com" className="flex flex-col items-center p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#e5322d] transition-all group">
                        <div className="mb-6 p-4 rounded-full bg-red-50 text-[#e5322d] group-hover:bg-[#e5322d] group-hover:text-white transition-colors">
                            <Mail className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-[#33333b] mb-2">Support</h3>
                        <p className="text-center text-sm text-[#47474f] mb-4">
                            Need help with a tool or have a question?
                        </p>
                        <span className="text-[#e5322d] font-semibold">support@pdfbaba.com</span>
                        <span className="text-xs text-gray-400 mt-2">Typically within 24 hours</span>
                    </Link>

                    {/* Feedback */}
                    <Link href="mailto:feedback@pdfbaba.com" className="flex flex-col items-center p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#e5322d] transition-all group">
                        <div className="mb-6 p-4 rounded-full bg-red-50 text-[#e5322d] group-hover:bg-[#e5322d] group-hover:text-white transition-colors">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-[#33333b] mb-2">Feedback</h3>
                        <p className="text-center text-sm text-[#47474f] mb-4">
                            Have a suggestion to improve PDF Baba?
                        </p>
                        <span className="text-[#e5322d] font-semibold">feedback@pdfbaba.com</span>
                        <span className="text-xs text-gray-400 mt-2">We read every message</span>
                    </Link>

                    {/* Partnership */}
                    <Link href="mailto:partners@pdfbaba.com" className="flex flex-col items-center p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#e5322d] transition-all group">
                        <div className="mb-6 p-4 rounded-full bg-red-50 text-[#e5322d] group-hover:bg-[#e5322d] group-hover:text-white transition-colors">
                            <Briefcase className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-[#33333b] mb-2">Partnership</h3>
                        <p className="text-center text-sm text-[#47474f] mb-4">
                            Business and integration inquiries
                        </p>
                        <span className="text-[#e5322d] font-semibold">partners@pdfbaba.com</span>
                        <span className="text-xs text-gray-400 mt-2">For business proposals</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
