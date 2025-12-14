export default function TermsPage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-16 md:px-6 max-w-4xl">
                <h1 className="mb-8 text-4xl font-extrabold text-[#33333b]">Terms of Service</h1>
                <div className="prose prose-lg text-[#47474f]">
                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">1. Agreement to Terms</h2>
                    <p>By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.</p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">2. Use License</h2>
                    <p>Permission is granted to use our PDF tools for personal or commercial use. However, you may not:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>Use the service for any illegal purpose.</li>
                        <li>Attempt to reverse engineer any software contained on the website.</li>
                        <li>Overload or disrupt our servers.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">3. Disclaimer</h2>
                    <p>The materials on PDF Baba's website are provided on an 'as is' basis. We make no warranties, expressed or implied, regarding reliability or accuracy.</p>

                    <h2 className="text-2xl font-bold text-[#33333b] mt-8 mb-4">4. Limitations</h2>
                    <p>In no event shall PDF Baba be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on our website.</p>
                </div>
            </div>
        </div>
    )
}
