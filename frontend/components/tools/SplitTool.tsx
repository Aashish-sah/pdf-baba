import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Split, Trash2, Eye } from 'lucide-react';
import { RelatedTools } from './RelatedTools';
import { API_BASE_URL } from '@/lib/api';

interface SplitStats {
    totalPages: number;
    outputSizeKB: number;
}

const SplitTool = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [range, setRange] = useState('1-');
    const [pageNumbers, setPageNumbers] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<SplitStats | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [filePageCount, setFilePageCount] = useState<number | null>(null);

    const analyzeFile = async (fileToAnalyze: File) => {
        const formData = new FormData();
        formData.append('files', fileToAnalyze);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tools/analyze`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                setFilePageCount(result.stats.totalPages);
            }
        } catch (error) {
            console.error("Analysis failed", error);
        }
    };

    // Create object URL for preview
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setFileUrl(null);
        }
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleFiles = (fileList: FileList) => {
        if (fileList.length > 0) {
            if (fileList[0].type !== 'application/pdf') {
                setError('Please upload a PDF file.');
                return;
            }
            setFile(fileList[0]);
            setError('');
            setDownloadUrl(null);
            setStats(null);
            setStats(null);
            setRange('1-');
            setPageNumbers(false);
            setFilePageCount(null);
            analyzeFile(fileList[0]);
        }
    }

    const handleSplit = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');

        const formData = new FormData();
        formData.append('files', file);
        formData.append('properties', JSON.stringify({ range, pageNumbers }));

        try {
            const response = await fetch(`${API_BASE_URL}/api/tools/split`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setDownloadUrl(result.downloadUrl);
                setStats(result.stats);

                // Update preview to show the result file
                // Construct logic similar to download link logic
                let originalName = file.name.replace(/\.pdf$/i, '') || 'split_file';
                const cleanRange = range.replace(/[^0-9a-zA-Z\-]/g, '');
                const finalName = `${originalName}_split_${cleanRange}_pdfbaba.pdf`;

                const baseUrl = result.downloadUrl.startsWith('http') ? result.downloadUrl : `${API_BASE_URL}${result.downloadUrl}`;
                const urlObj = new URL(baseUrl);
                urlObj.searchParams.set('name', finalName);
                const previewUrl = urlObj.href;
                setFileUrl(previewUrl);

            } else {
                throw new Error(result.error || 'Split failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!downloadUrl) return

        setIsDownloading(true);
        setCountdown(3);

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    triggerDownload();
                    setIsDownloading(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    const triggerDownload = () => {
        const a = document.createElement('a')

        let originalName = file?.name.replace(/\.pdf$/i, '') || 'split_file';
        // Append range description if simple
        const cleanRange = range.replace(/[^0-9a-zA-Z\-]/g, '');
        const finalName = `${originalName}_split_${cleanRange}_pdfbaba.pdf`;

        // Pass the desired filename to the backend via query param
        const baseUrl = downloadUrl!.startsWith('http') ? downloadUrl! : `${API_BASE_URL}${downloadUrl}`;
        const urlObj = new URL(baseUrl);
        urlObj.searchParams.set('name', finalName);
        const downloadUrlWithName = urlObj.href;

        a.href = downloadUrlWithName;
        a.download = finalName;
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header removed to avoid duplication with page.tsx */}

            {!file ? (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-red-200 rounded-3xl p-12 text-center bg-white hover:bg-red-50 transition-colors cursor-pointer group"
                >
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-red-200">
                            <Upload className="w-10 h-10 text-white" />
                        </div>
                        <span className="inline-block px-8 py-4 bg-red-500 text-white rounded-xl font-semibold text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-200 mb-4">
                            Select PDF file
                        </span>
                        <p className="text-gray-500 text-lg">or drop PDF here</p>
                    </label>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row h-[800px]">

                    {/* Left Side: PDF Viewer */}
                    <div className="flex-1 bg-gray-100 p-4 border-r border-gray-200 relative">
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-sm font-medium text-gray-600 shadow-sm z-10">
                            <div className="flex flex-col">
                                <span>{file.name}</span>
                                {filePageCount !== null && (
                                    <span className="text-xs text-gray-500 mt-0.5">{filePageCount} pages</span>
                                )}
                            </div>
                        </div>
                        {fileUrl && (
                            <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full rounded-xl shadow-sm border border-gray-300 bg-white"
                                title="PDF Preview"
                            />
                        )}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm pointer-events-none">
                            Scroll to see all pages
                        </div>
                    </div>

                    {/* Right Side: Controls */}
                    <div className="w-full lg:w-96 bg-white p-8 flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] relative">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Split Options</h2>
                            <button
                                onClick={() => setFile(null)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                title="Remove file"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {!downloadUrl ? (
                            <div className="flex-1 flex flex-col gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Page Range
                                    </label>
                                    <input
                                        type="text"
                                        value={range}
                                        onChange={(e) => setRange(e.target.value)}
                                        placeholder="e.g. 1-5, 8, 11-13"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                                        Examples: <br />
                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">1-5</code> (Pages 1 to 5)<br />
                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">5-</code> (Page 5 to end)<br />
                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">1,3,5</code> (Specific pages)
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <input
                                        type="checkbox"
                                        id="pageNumbers"
                                        checked={pageNumbers}
                                        onChange={(e) => setPageNumbers(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <label htmlFor="pageNumbers" className="text-gray-700 font-medium cursor-pointer select-none">
                                        Add Page Numbers
                                    </label>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={handleSplit}
                                        disabled={isProcessing || !range.trim()}
                                        className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 group"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Split PDF
                                                <Split size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <div className="w-full max-w-sm text-center">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Split size={40} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Split Complete!</h3>
                                    <p className="text-gray-500 text-lg mb-8">
                                        Your PDF has been split successfully.
                                    </p>

                                    <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm w-full">
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="text-gray-500">Selected Range</span>
                                            <span className="font-semibold text-gray-900">{range}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="text-gray-500">Total Pages</span>
                                            <span className="font-semibold text-gray-900">{stats?.totalPages}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Size</span>
                                            <span className="font-semibold text-gray-900">{stats?.outputSizeKB} KB</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 w-full">
                                        <button
                                            onClick={handleDownload}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            {isDownloading ? (
                                                `Starting in ${countdown}...`
                                            ) : (
                                                <>
                                                    <Download size={24} />
                                                    Download PDF
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDownloadUrl(null);
                                                setStats(null);
                                                setIsDownloading(false);
                                            }}
                                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Split Another Range
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-in fade-in">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SEO Content & Navigation */}
            <div className="max-w-4xl mx-auto mt-20 px-4 space-y-12">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">
                    <article className="prose prose-lg max-w-none">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 font-display">
                            Split PDF & Extract Pages Online
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            PDFBaba's <strong>Split PDF</strong> tool gives you total control over your documents.
                            Extract specific pages, separate a large PDF into smaller files, or remove unwanted pages instantly.
                            Use our visual preview to ensure you're splitting exactly what you need.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                                    How to Split
                                </h3>
                                <ol className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Upload PDF:</strong> Select a file from your device or drag it here.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Choose Range:</strong> Enter page numbers (1-5) or specific pages (1,3,5).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Preview:</strong> Check the file preview to confirm page numbers.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Download:</strong> Click "Split PDF" to save your new file.</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                    Why use PDFBaba?
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Precise Extraction:</strong> Our advanced range selector handles complex needs.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Fast & Free:</strong> Process documents in seconds without any cost.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Privacy First:</strong> Your files are yours alone and are never stored.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </article>
                </div>

                <RelatedTools currentTool="split-pdf" />
            </div>
        </div>
    );
};

export default SplitTool;
