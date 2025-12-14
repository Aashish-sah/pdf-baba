
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Download, Settings, Check, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { RelatedTools } from './RelatedTools';
import { API_BASE_URL } from '@/lib/api';

export function PdfToImageTool() {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Settings
    const [format, setFormat] = useState('jpg');
    const [dpi, setDpi] = useState('150');
    const [color, setColor] = useState('color');
    const [selectionMode, setSelectionMode] = useState<'all' | 'custom'>('all');
    const [customRange, setCustomRange] = useState('');

    // Process State
    const [isConverting, setIsConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [filename, setFilename] = useState('converted_images');
    const [isDownloading, setIsDownloading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Initial Analysis
    const analyzeFile = async (uploadedFile: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('files', uploadedFile);

            const res = await fetch(`${API_BASE_URL}/api/tools/analyze`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setTotalPages(data.stats.totalPages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // File Handling
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const f = acceptedFiles[0];
            setFile(f);
            setFilename(f.name.replace(/\.[^/.]+$/, "")); // Remove extension
            setFileUrl(URL.createObjectURL(f));
            analyzeFile(f);

            // Reset states
            setDownloadUrl(null);
            setStats(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    // Conversion
    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        try {
            const formData = new FormData();
            formData.append('files', file);

            // Determine pages
            let pagesToSend = 'all';
            if (selectionMode === 'custom' && customRange.trim()) {
                pagesToSend = customRange.trim();
            }

            const properties = {
                format,
                dpi: parseInt(dpi),
                color,
                pages: pagesToSend
            };

            formData.append('properties', JSON.stringify(properties));

            const res = await fetch(`${API_BASE_URL}/api/tools/pdf-to-image`, {
                method: 'POST',
                body: formData
            });

            const validJson = await res.json();

            if (validJson.success) {
                setDownloadUrl(validJson.downloadUrl);
                setStats(validJson.stats);
            } else {
                alert('Conversion failed: ' + (validJson.error || validJson.message));
            }

        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownload = () => {
        if (!downloadUrl) return;

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
    };

    const triggerDownload = () => {
        const link = document.createElement('a');

        // Construct filename suffix logic
        // Rule: <base-name>_page-<number>_pdfbaba
        // But since we might download a ZIP, we just apply the suffix to the file being downloaded.
        // If ZIP: base_pdfbaba.zip
        // If single file (e.g. JPG): base_page-1_pdfbaba.jpg
        // The Controller already sends a downloadUrl that points to a file with a name.
        // We just need to ensure the LOCAL name matches user input 'filename'.

        // If it's a zip
        let finalName = "";
        if (downloadUrl?.endsWith('.zip')) {
            finalName = `${filename}_pdfbaba.zip`;
        } else {
            // Single file
            // We don't know page number here easily unless we track it, but for single file mode we can just append suffix
            const ext = downloadUrl?.split('.').pop();
            finalName = `${filename}_pdfbaba.${ext}`;
        }

        // We use the query param to tell backend to send Content-Disposition with this name?
        // Or we just rely on the 'download' attribute.
        // Our API supports ?name=...
        const baseUrl = downloadUrl!.startsWith('http') ? downloadUrl! : `${API_BASE_URL}${downloadUrl}`;
        const urlObj = new URL(baseUrl);
        urlObj.searchParams.set('name', finalName);
        const dlUrl = urlObj.href;

        link.href = dlUrl;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setFile(null);
        setDownloadUrl(null);
        setStats(null);
        setTotalPages(0);
    };

    // --- RENDER ---
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">

            {/* 1. UPLOAD VIEW */}
            {!file ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer bg-white hover:bg-gray-50
                        ${isDragActive ? 'border-red-500 bg-red-50' : 'border-gray-200'}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Convert PDF to Image</h3>
                    <p className="text-gray-500 mb-8">Drag & drop a PDF, or click to select</p>
                    <button className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                        Choose PDF File
                    </button>
                    <p className="mt-6 text-xs text-gray-400">Supported: PDF to JPG, PNG, WEBP, TIFF, BMP</p>
                </div>
            ) : (
                // 2. WORKSPACE
                !downloadUrl ? (
                    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4">

                        {/* LEFT: PREVIEW */}
                        <div className="flex-1 bg-gray-100 rounded-3xl border border-gray-200 p-6 flex flex-col relative min-h-[500px]">
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 shadow-sm z-10 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="max-w-[200px] truncate">{file.name}</span>
                                <span className="text-gray-400">|</span>
                                <span>{isAnalyzing ? '...' : `${totalPages} Pages`}</span>
                            </div>

                            {fileUrl && (
                                <iframe
                                    src={`${fileUrl}#toolbar=0&navpanes=0`}
                                    className="w-full flex-1 rounded-xl bg-white shadow-sm border border-gray-200"
                                    title="PDF Preview"
                                />
                            )}

                            <div className="mt-4 flex justify-between items-center text-sm text-gray-500 px-2">
                                <span>Previewing Document</span>
                                <button onClick={reset} className="text-red-600 hover:text-red-700 font-medium">Remove File</button>
                            </div>
                        </div>

                        {/* RIGHT: SETTINGS */}
                        <div className="w-full lg:w-96 shrink-0 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    Image Settings
                                </h3>

                                {/* Format */}
                                <div className="mb-5">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Output Format</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['jpg', 'png', 'webp'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFormat(f)}
                                                className={`py-2 rounded-lg text-sm font-bold border transition-all uppercase
                                                    ${format === f ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}
                                                `}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {['tiff', 'bmp'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFormat(f)}
                                                className={`py-2 rounded-lg text-xs font-bold border transition-all uppercase
                                                    ${format === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                                                `}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* DPI */}
                                <div className="mb-5">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Image Quality (DPI)</label>
                                    <select
                                        value={dpi}
                                        onChange={(e) => setDpi(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none focus:border-red-500"
                                    >
                                        <option value="72">72 DPI (Screen / Web)</option>
                                        <option value="150">150 DPI (Standard)</option>
                                        <option value="300">300 DPI (High Quality)</option>
                                    </select>
                                </div>

                                {/* Color Mode */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Color Mode</label>
                                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        {[
                                            { id: 'color', label: 'Color' },
                                            { id: 'gray', label: 'Grayscale' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setColor(m.id)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                                                    ${color === m.id ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}
                                                `}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* Pages */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Pages to Convert</label>
                                    <div className="flex flex-col gap-3">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="selection"
                                                checked={selectionMode === 'all'}
                                                onChange={() => setSelectionMode('all')}
                                                className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300"
                                            />
                                            <span className="font-medium text-gray-700">All Pages</span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="selection"
                                                checked={selectionMode === 'custom'}
                                                onChange={() => setSelectionMode('custom')}
                                                className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 mt-1"
                                            />
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-700 block mb-2">Page Range</span>
                                                <input
                                                    type="text"
                                                    disabled={selectionMode !== 'custom'}
                                                    value={customRange}
                                                    onChange={(e) => setCustomRange(e.target.value)}
                                                    placeholder="e.g. 1-3, 5, 8"
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isConverting ? (
                                        <>
                                            <RefreshCw className="animate-spin w-5 h-5" />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            Convert to {format.toUpperCase()}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                ) : (
                    // 3. SUCCESS STATE
                    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="w-full max-w-sm text-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Check size={40} strokeWidth={3} />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Images Ready!</h2>
                            <p className="text-gray-500 mb-8">
                                Converted {stats?.totalFiles || 'file(s)'} successfully ({stats?.outputSizeKB} KB).
                            </p>

                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-left mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    File Name
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none font-bold"
                                        placeholder="filename"
                                    />
                                    <span className="text-gray-400 text-sm font-medium">_pdfbaba</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3"
                                >
                                    {isDownloading ? (
                                        `Starting Download in ${countdown}...`
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            Download Images
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={reset}
                                    className="w-full py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Convert Another PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* SEO Content */}
            <div className="max-w-4xl mx-auto mt-20 px-4 space-y-12">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">
                    <article className="prose prose-lg max-w-none">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 font-display">
                            Convert PDF to Image Online High Quality
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            PDFBaba's **PDF to Image** converter lets you turn PDF pages into high-quality JPG, PNG, WEBP, or TIFF images.
                            Perfect for sharing slides on social media, using PDF content in designs, or simply viewing documents as photos.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                                    How to Use
                                </h3>
                                <ol className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Upload:</strong> Drop your PDF file here.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Settings:</strong> Choose JPG/PNG and setup DPI (High/Low).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Select Pages:</strong> Convert all pages or just a specific range.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Download:</strong> Get your images instantly.</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                    Features
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>High Resolution:</strong> Up to 300 DPI for print-ready images.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Multiple Formats:</strong> JPG, PNG, WEBP, TIFF, BMP support.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Secure:</strong> Files processed safely and deleted automatically.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </article>
                </div>
                <RelatedTools currentTool="pdf-to-jpg" />
            </div>
        </div>
    );
}
