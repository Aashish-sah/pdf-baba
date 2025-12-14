export default function PrivacyPage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-16 md:px-6 max-w-4xl">
                <h1 className="mb-8 text-4xl font-extrabold text-[#33333b]">Privacy Policy</h1>
                <div className="prose prose-lg text-[#47474f]">
                    <p className="mb-4">Effective Date: {new Date().toLocaleDateString()}</p>
                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">1. Introduction</h2>
                    <p>Welcome to PDF Baba. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">2. The Data We Collect</h2>
                    <p>We do not collect any personal data such as names, emails, or phone numbers unless you voluntarily provide them (e.g., contacting support). We do not require registration to use our tools.</p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">3. File Handling</h2>
                    <p>Uploaded files are processed automatically by our servers. We do not view, read, or copy your files. <strong>All files are automatically deleted from our servers after 1 hour.</strong></p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">4. Cookies</h2>
                    <p>We use essential cookies to ensure the website functions correctly. We may use third-party analytics (like Google Analytics) to understand usage patterns, but this data is anonymized.</p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">5. Contact Us</h2>
                    <p>If you have any questions about this privacy policy, please contact us at support@pdfbaba.com.</p>
                </div>
            </div>
        </div>
    )
}
