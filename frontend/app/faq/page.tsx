
export default function FAQPage() {
    const faqs = [
        {
            question: "Is PDF Baba really free?",
            answer: "Yes! All our tools are 100% free to use. There are no limits on the number of files you can process or the file size."
        },
        {
            question: "Are my files safe?",
            answer: "Absolutely. We use HTTPS encryption to protect your files. Your files are automatically deleted from our servers 1 hour after processing."
        },
        {
            question: "Do I need to create an account?",
            answer: "No account is required. You can use all our tools anonymously without signing up."
        },
        {
            question: "What platforms do you support?",
            answer: "PDF Baba works in your web browser, so it supports all operating systems including Windows, Mac, Linux, iOS, and Android."
        },
        {
            question: "How do I merge multiple PDFs?",
            answer: "Simply use our 'Merge PDF' tool, upload your files, arrange them in the desired order, and click 'Merge'."
        },
        {
            question: "Can I compress PDFs without losing quality?",
            answer: "Yes, our compression tool is optimized to reduce file size significantly while maintaining high visual quality for documents."
        },
        {
            question: "Is there a limit to how many files I can convert?",
            answer: "We are currently offering unrestricted access to all users."
        },
        {
            question: "How can I contact support?",
            answer: "If you have any issues, please reach out to us via our Contact page. We typically respond within 24 hours."
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-16 md:px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#33333b] sm:text-5xl">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-[#47474f] max-w-2xl mx-auto">
                        Everything you need to know about PDF Baba.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="flex items-center text-lg font-bold text-[#33333b] mb-3">
                                <Plus className="w-5 h-5 text-[#e5322d] mr-3 flex-shrink-0" />
                                {faq.question}
                            </h3>
                            <p className="pl-8 text-[#47474f] leading-relaxed border-l-2 border-gray-100">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[#47474f] mb-4">
                        Still have questions?
                    </p>
                    <a href="/contact" className="inline-block px-8 py-3 rounded-lg bg-[#e5322d] text-white font-bold hover:bg-[#d42d29] transition-colors shadow-lg shadow-red-500/20">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    )
}
