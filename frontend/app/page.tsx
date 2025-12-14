import { ToolIcon } from "@/components/ui/ToolIcon";
import { TOOLS_CONFIG } from "@/lib/tools";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check } from "lucide-react";

export default function Home() {
  const popularTools = Object.values(TOOLS_CONFIG).filter(t => t.popular);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-[#f2f5f7] py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-4xl font-extrabold text-[#33333b] md:text-5xl">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-xl text-[#47474f]">
            Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use!
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
          </p>
        </div>
      </section>

      {/* Popular Tools Grid */}
      <section className="container mx-auto px-4 -mt-10 mb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {popularTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group relative flex flex-col items-center p-8 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <ToolIcon
                name={tool.icon}
                colorClass={tool.color}
                className="w-16 h-16 mb-6 rounded-2xl"
              />
              <h3 className="mb-2 text-xl font-bold text-gray-800">{tool.title}</h3>
              <p className="text-center text-sm text-gray-500 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">The PDF Software Trusted by Millions</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Check className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-800">100% Free & Secure</h4>
                  <p className="text-gray-600">We don't charge anything. Your files are automatically deleted after 1 hour.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-800">Cross-Platform</h4>
                  <p className="text-gray-600">Works on Chrome, Firefox, Safari, Edge, and on any device.</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            {/* Decorative Illustration (CSS Only) */}
            <div className="bg-blue-50 rounded-3xl p-8 transform rotate-2">
              <div className="bg-white rounded-xl shadow-lg p-6 transform -rotate-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-blue-100 rounded flex items-center justify-center text-blue-300">
                  PDF Preview
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Ready to get started?</h2>
          <Link
            href="/tools"
            className="inline-block bg-[#e5322d] text-white font-bold py-4 px-10 rounded-lg text-xl hover:bg-[#d42d29] transition-colors shadow-lg shadow-red-500/30"
          >
            View All PDF Tools
          </Link>
          <p className="mt-4 text-gray-500">No account required</p>
        </div>
      </section>
    </div>
  );
}
