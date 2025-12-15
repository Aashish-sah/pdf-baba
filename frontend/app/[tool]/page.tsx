"use client"

import { useState, useEffect } from "react"
import { TOOLS_CONFIG, ToolId } from "@/lib/tools"
import { API_BASE_URL } from "@/lib/api"
import { ToolIcon } from "@/components/ui/ToolIcon"
import { Check, Zap, FileText, Trash2, Download } from "lucide-react"
import { notFound, useParams } from "next/navigation"
import { FileUploader } from "@/components/tools/FileUploader"
import { MergeTool } from "@/components/tools/MergeTool"
import SplitTool from "@/components/tools/SplitTool"
import ImageToPdfTool from "@/components/tools/ImageToPdfTool"
import { PdfToImageTool } from "@/components/tools/PdfToImageTool"
import { PdfToWordTool } from "@/components/tools/PdfToWordTool"
import { ProtectPdfTool } from "@/components/tools/ProtectPdfTool"

export default function ToolPage() {
    const params = useParams()
    const toolId = params?.tool as string

    // State
    const [files, setFiles] = useState<File[]>([])
    // Steps: upload -> ready -> compressing -> countdown -> done
    const [status, setStatus] = useState<'upload' | 'ready' | 'compressing' | 'countdown' | 'done'>('upload')

    // Animation State
    const [pixelText, setPixelText] = useState("Initializing...")
    const [countdown, setCountdown] = useState(3)

    // Result State
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [downloadName, setDownloadName] = useState<string>("")
    const [stats, setStats] = useState<{ original: string, compressed: string, saved: string } | null>(null)


    const handleFilesSelected = (newFiles: File[]) => {
        setFiles(newFiles)
        setStatus('ready')
    }

    // Pixel Animation Effect
    useEffect(() => {
        if (status === 'compressing') {
            const texts = [
                "Analyzing pixels...",
                "Optimizing color depth...",
                "Reducing redundancy...",
                "Rebuilding PDF structure...",
                "Finalizing compression..."
            ]
            let i = 0
            const interval = setInterval(() => {
                setPixelText(texts[i % texts.length])
                i++
            }, 800)
            return () => clearInterval(interval)
        }
    }, [status])

    // Countdown Effect
    useEffect(() => {
        if (status === 'countdown') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        setStatus('done')
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [status])

    const startCompression = async () => {
        if (files.length === 0) return

        setStatus('compressing')

        try {
            const formData = new FormData()
            formData.append('files', files[0])
            // No options passed -> Backend uses default 50% logic

            const response = await fetch(`${API_BASE_URL}/api/tools/compress`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errData = await response.json()
                alert(`Error: ${errData.error || 'Compression failed'}`)
                setStatus('ready')
                return
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            // Set stats
            const originalSize = files[0].size
            const compressedSize = blob.size
            const saved = Math.round(((originalSize - compressedSize) / originalSize) * 100)

            setStats({
                original: `${Math.round(originalSize / 1024)} KB`,
                compressed: `${Math.round(compressedSize / 1024)} KB`,
                saved: `${saved}%`
            })

            setDownloadUrl(url)
            const originalName = files[0].name.replace(/\.pdf$/i, "")
            // Request: "keep string same just in end add _pdfbaba_compressed"
            setDownloadName(`${originalName}_pdfbaba_compressed.pdf`)

            // Start countdown
            setCountdown(3)
            setStatus('countdown')

        } catch (error) {
            console.error(error)
            alert("Network error.")
            setStatus('ready')
        }
    }

    const handleDownload = () => {
        if (!downloadUrl) return
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const reset = () => {
        setFiles([])
        setStatus('upload')
        setDownloadUrl(null)
    }

    if (!toolId || !TOOLS_CONFIG[toolId as ToolId]) {
        return notFound();
    }

    const tool = TOOLS_CONFIG[toolId as ToolId];


    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <section className="bg-[#f7f9fa] pt-4 pb-8 text-center border-b border-gray-100 flex flex-col justify-start">
                <div className="container mx-auto px-4">

                    {/* MAIN CARD */}
                    <div className="max-w-5xl mx-auto w-full flex justify-center">
                        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all duration-300">

                            {/* TOOL HEADER (Inside Box now) */}
                            {status === 'upload' && (
                                <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4">
                                    <div className="flex justify-center mb-4">
                                        <ToolIcon name={tool.icon} colorClass={tool.color} className="w-14 h-14 rounded-xl shadow-md" />
                                    </div>
                                    <h1 className="mb-2 text-3xl font-extrabold text-[#33333b]">{tool.title}</h1>
                                    <p className="mx-auto text-base text-[#47474f] max-w-xl">{tool.description}</p>
                                </div>
                            )}

                            {/* TOOL CONTENT CHECK: MERGE vs SPLIT vs OTHERS */}
                            {toolId === 'merge-pdf' ? (
                                <MergeTool tool={tool} />
                            ) : toolId === 'split-pdf' ? (
                                <SplitTool />
                            ) : (toolId === 'jpg-to-pdf' || toolId === 'image-to-pdf') ? (
                                <ImageToPdfTool />
                            ) : (toolId === 'pdf-to-image' || toolId === 'pdf-to-jpg') ? (
                                <PdfToImageTool />
                            ) : (toolId === 'pdf-to-word') ? (
                                <PdfToWordTool />
                            ) : (toolId === 'protect-pdf') ? (
                                <ProtectPdfTool />
                            ) : (
                                <>
                                    {/* STANDARD TOOL UI (COMPRESS, ETC) */}
                                    {/* 1. UPLOAD STATE */}
                                    {status === 'upload' && (
                                        <FileUploader
                                            onFilesSelected={handleFilesSelected}
                                            accept={tool.accept}
                                            multiple={tool.multiple}
                                        />
                                    )}

                                    {/* 2. READY STATE (Selected) */}
                                    {status === 'ready' && (
                                        <div className="text-center animate-in fade-in zoom-in-95">
                                            <div className="flex items-center justify-center gap-3 mb-8 bg-blue-50 py-3 px-6 rounded-lg inline-flex mx-auto">
                                                <FileText className="w-6 h-6 text-[#3b469b]" />
                                                <span className="font-bold text-gray-700">{files[0]?.name}</span>
                                                <button onClick={reset} className="ml-2 p-1 hover:bg-white rounded-full transition-colors">
                                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={startCompression}
                                                className="w-full bg-[#e5322d] text-white font-bold py-4 rounded-xl text-xl hover:bg-[#d42d29] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                            >
                                                Compress & Download
                                            </button>
                                        </div>
                                    )}

                                    {/* 3. COMPRESSING ANIMATION */}
                                    {status === 'compressing' && (
                                        <div className="py-8 text-center animate-in fade-in">
                                            <div className="relative w-24 h-24 mx-auto mb-6">
                                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-[#e5322d] border-t-transparent rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Zap className="w-8 h-8 text-[#e5322d] animate-pulse" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Compressing PDF...</h3>
                                            <p className="text-gray-500 font-mono text-sm animate-pulse">{pixelText}</p>
                                        </div>
                                    )}

                                    {/* 4. COUNTDOWN */}
                                    {status === 'countdown' && (
                                        <div className="py-12 text-center animate-in fade-in zoom-in-95">
                                            <p className="text-gray-500 mb-4 font-bold text-lg">Your file is ready!</p>
                                            <div className="text-8xl font-black text-[#3b469b] animate-bounce">
                                                {countdown}
                                            </div>
                                            <p className="text-gray-400 mt-4 text-sm">Generating download link...</p>
                                        </div>
                                    )}

                                    {/* 5. DONE (Download) */}
                                    {status === 'done' && stats && (
                                        <div className="text-center animate-in fade-in zoom-in-95">
                                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Check className="w-10 h-10" />
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-4 mb-8 flex justify-around text-center">
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Before</div>
                                                    <div className="text-gray-900 font-bold">{stats.original}</div>
                                                </div>
                                                <div className="text-gray-300">|</div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">After</div>
                                                    <div className="text-[#3b469b] font-bold">{stats.compressed}</div>
                                                </div>
                                                <div className="text-gray-300">|</div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Saved</div>
                                                    <div className="text-green-600 font-bold">{stats.saved}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleDownload}
                                                className="w-full bg-[#3b469b] text-white font-bold py-4 rounded-xl text-xl hover:bg-[#2d3678] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                                            >
                                                <Download className="w-6 h-6" />
                                                Download Now
                                            </button>

                                            <button onClick={reset} className="mt-4 text-gray-400 hover:text-gray-600 text-sm font-medium hover:underline">
                                                Compress another file
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO & CONTENT SECTION */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4 max-w-4xl text-left">

                    {/* HOW TO */}
                    {tool.content && (
                        <article className="mb-12">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">How to {tool.title} Online for Free?</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {tool.content.howTo.map((step, index) => (
                                    <div key={index} className="p-6 bg-gray-50 rounded-xl">
                                        <span className={`${step.color} font-bold text-xl mb-2 block`}>0{step.step}. {step.title}</span>
                                        <p className="text-gray-600">{step.description}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    )}

                    {/* FAQ */}
                    {tool.content && (
                        <article>
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-6">
                                {tool.content.faqs.map((faq, index) => (
                                    <div key={index}>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{faq.question}</h3>
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    )}

                </div>
            </section>
        </div>
    )
}
