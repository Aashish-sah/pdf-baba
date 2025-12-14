export default function AboutPage() {
    const values = [
        {
            title: "Simplicity First",
            description: "One-click tools that require no learning curve."
        },
        {
            title: "Privacy by Design",
            description: "Your files are yours alone. We don't store, view, or share them."
        },
        {
            title: "Freedom Forever",
            description: "Core tools will always remain free for everyone."
        },
        {
            title: "Continuous Improvement",
            description: "We constantly improve based on user feedback."
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-16 md:px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#33333b] sm:text-5xl">
                        About PDF Baba
                    </h1>
                    <p className="text-xl text-[#47474f] max-w-2xl mx-auto">
                        We're on a mission to make PDF tools accessible to everyone, everywhere.
                        Essential document tools should be free, simple, and secure.
                    </p>
                </div>

                <div className="mb-20">
                    <div className="relative rounded-2xl bg-[#e5322d] px-6 py-12 md:px-12 md:py-16 text-center text-white overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                                PDF Baba was born out of frustration with complex, expensive PDF tools.
                                As students and professionals ourselves, we needed simple tools that just worked.
                                In 2024, we decided to build what we wanted: a completely free, no-nonsense PDF toolkit.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {values.map((value, index) => (
                        <div key={index} className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="mb-3 text-xl font-bold text-[#33333b]">
                                {value.title}
                            </h3>
                            <p className="text-[#47474f] leading-relaxed">
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
