
"use client"

import React, { useState, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { Upload, FileText, Download, X, AlertCircle, RefreshCw, CheckCircle2, FileType } from 'lucide-react';
import { RelatedTools } from './RelatedTools';
import { API_BASE_URL } from '@/lib/api';

export function PdfToWordTool() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionMode, setConversionMode] = useState<'editable' | 'ocr'>('editable');
    const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
    const [pageRange, setPageRange] = useState('');

    // Result
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [baseFilename, setBaseFilename] = useState('');
    const [finalFilename, setFinalFilename] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleFilesSelected = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setBaseFilename(uploadedFile.name.replace(/\.[^/.]+$/, ""));
            // Automatically set default output name
            setFinalFilename(uploadedFile.name.replace(/\.[^/.]+$/, ""));
        }
    }, []);

    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        const formData = new FormData();
        formData.append('files', file);

        const properties = {
            mode: conversionMode,
            pages: pageSelection === 'all' ? 'all' : pageRange
        };
        formData.append('properties', JSON.stringify(properties));

        try {
            const res = await fetch(`${API_BASE_URL}/api/tools/pdf-to-word`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setDownloadUrl(data.downloadUrl);
            } else {
                alert('Conversion failed: ' + (data.error || 'Unknown error'));
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
        const filename = `${finalFilename}_pdfbaba.docx`;
        try {
            // Use URL object to resolve path and encoding automatically
            const url = new URL(downloadUrl!, API_BASE_URL);
            url.searchParams.set('name', filename);

            const link = document.createElement('a');
            link.href = url.href;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Invalid download URL", e);
            alert("Error preparing download link.");
        }
    };

    const reset = () => {
        setFile(null);
        setDownloadUrl(null);
        setPageRange('');
        setIsDownloading(false);
        setCountdown(0);
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {!file ? (
                <FileUploader
                    onFilesSelected={handleFilesSelected}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    multiple={false}
                />
            ) : (
                <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">

                    {/* LEFT: Preview / Upload */}
                    <div className="flex-1 p-8 bg-gray-50/50 flex flex-col">
                        <div className="flex-1 flex flex-col h-full relative">
                            {!downloadUrl ? (
                                <div className="flex-1 bg-gray-200 rounded-2xl overflow-hidden relative">
                                    <iframe src={URL.createObjectURL(file)} className="w-full h-full border-none" title="PDF Preview" />
                                    <button onClick={reset} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center animate-in fade-in zoom-in-95 max-w-2xl mx-auto h-full flex flex-col justify-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>

                                    <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Conversion Complete!</h2>
                                    <p className="text-gray-500 mb-6 text-sm">Your Word document is ready for download.</p>

                                    {/* RENAME CARD */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-left">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Save File As
                                        </label>
                                        <div className="relative flex items-center max-w-lg">
                                            <input
                                                type="text"
                                                value={finalFilename}
                                                onChange={(e) => setFinalFilename(e.target.value)}
                                                className="w-full text-base font-bold text-gray-800 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 pr-24 focus:border-[#3b469b] focus:outline-none transition-all shadow-sm"
                                                placeholder="document_name"
                                            />
                                            <div className="absolute right-4 text-xs font-bold text-gray-400 pointer-events-none">_pdfbaba.docx</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mb-4">
                                        <button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className={`flex-1 bg-[#3b469b] text-white font-bold py-3 rounded-xl text-base hover:bg-[#2d3678] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${isDownloading ? 'cursor-not-allowed opacity-90' : ''}`}
                                        >
                                            {isDownloading ? (
                                                <span className="animate-pulse text-xl">Starting in {countdown}...</span>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    Download Word
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={reset}
                                            className="px-5 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-base hover:bg-gray-200 transition-colors"
                                        >
                                            Convert Another
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
                                        <div>
                                            <span className="block font-bold text-gray-800 text-lg">DOCX</span>
                                            Format
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-800 text-lg">
                                                {conversionMode === 'ocr' ? 'OCR' : 'Editable'}
                                            </span>
                                            Mode
                                        </div>
                                        {/* We could add size here if we saved it from API response, but strictly we didn't save it in state yet unless we update component state */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Settings Panel */}
                    {!downloadUrl && (
                        <div className="w-full md:w-96 border-l border-gray-200 bg-white p-8 flex flex-col">
                            <div className="flex items-center space-x-2 mb-8">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                            </div>

                            <div className="space-y-8 flex-1">
                                {/* Conversion Mode */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Conversion Mode</label>
                                    <div className="space-y-3">
                                        <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${conversionMode === 'editable' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" name="mode" className="mt-1" checked={conversionMode === 'editable'} onChange={() => setConversionMode('editable')} />
                                            <div className="ml-3">
                                                <span className="block font-bold text-gray-900">Editable Text</span>
                                                <span className="text-sm text-gray-500">Reconstructs layout. Best for standard PDFs.</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${conversionMode === 'ocr' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <img src="/tool-icons/pdf-to-word.png?v=3" alt="PDF to Word" className="w-12 h-12" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            <input type="radio" name="mode" className="mt-1" checked={conversionMode === 'ocr'} onChange={() => setConversionMode('ocr')} />
                                            <div className="ml-3">
                                                <span className="block font-bold text-gray-900">OCR (Scanned)</span>
                                                <span className="text-sm text-gray-500">Detects text in images. Best for scans.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Page Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Pages to Convert</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" checked={pageSelection === 'all'} onChange={() => setPageSelection('all')} className="w-5 h-5 text-blue-600" />
                                            <span className="text-gray-700 font-medium">All Pages</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" checked={pageSelection === 'range'} onChange={() => setPageSelection('range')} className="w-5 h-5 text-blue-600" />
                                            <span className="text-gray-700 font-medium">Page Range</span>
                                        </label>
                                    </div>
                                    {pageSelection === 'range' && (
                                        <input
                                            type="text"
                                            placeholder="e.g. 1-3, 5, 8"
                                            value={pageRange}
                                            onChange={(e) => setPageRange(e.target.value)}
                                            className="mt-3 w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all ${isConverting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30 hover:scale-[1.02]'}`}
                            >
                                {isConverting ? (
                                    <span className="flex items-center justify-center">
                                        <RefreshCw className="animate-spin mr-2" /> Converting...
                                    </span>
                                ) : (
                                    'Convert to Word'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* SEO & Manual Content */}
            <div className="mt-24 mb-16 max-w-5xl mx-auto space-y-16">
                {/* Overview */}
                <section>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">PDF to Word Converter</h2>
                    <div className="prose prose-lg text-gray-600">
                        <p>
                            Convert PDF files into fully editable Microsoft Word documents (.docx) while preserving text, layout, tables, and formatting.
                            Unlike other tools, we don't just paste images into Word—we create a real, editable document suitable for professional use.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                            <p className="text-sm text-yellow-800 m-0">
                                <strong>Note:</strong> This tool creates true Word documents where text is selectable and tables are real Word tables.
                            </p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Conversion Modes</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4 flex-shrink-0">1</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Editable Text Mode</h4>
                                    <p className="text-sm text-gray-600">Best for standard PDFs. Recreates paragraphs, lists, and tables intelligently.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-4 flex-shrink-0">2</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">OCR Mode</h4>
                                    <p className="text-sm text-gray-600">Ideal for scanned documents. Detects text within images and makes it editable.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">What Is Preserved?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['Editable Text', 'Tables & Forms', 'Headings', 'Bullet Lists', 'Page Breaks', 'Fonts & Styling'].map((item) => (
                                <div key={item} className="flex items-center text-gray-700 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Convert PDF to Word</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Upload PDF', desc: 'Drag and drop your PDF file into the upload area.' },
                            { title: 'Choose Mode', desc: 'Select "Editable Text" or "OCR" based on your file type.' },
                            { title: 'Download', desc: 'Get your formatted .docx file instantly.' }
                        ].map((step, i) => (
                            <div key={i} className="text-center">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{i + 1}</div>
                                <h4 className="font-bold text-gray-900 mb-2">{step.title}</h4>
                                <p className="text-sm text-gray-500">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <RelatedTools currentTool="pdf-to-word" />
        </div >
    );
}
