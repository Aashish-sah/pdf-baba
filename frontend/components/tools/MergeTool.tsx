'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FileText, X, AlertCircle, ArrowRight, Download, Edit2, Settings, FileCheck } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { RelatedTools } from './RelatedTools';
import { ToolConfig } from '@/lib/tools';
import { API_BASE_URL } from '@/lib/api';

interface MergeToolProps {
    tool: ToolConfig;
}

interface PDFFile {
    id: string;
    name: string;
    size: number;
    file: File;
    previewUrl?: string; // For thumbnail
}

interface MergeProperties {
    paperSize: 'a4' | 'letter';
    orientation: 'portrait' | 'landscape';
    normalize: boolean;
    pageNumbers: boolean;
    blankPage: boolean; // Replaced TOC with this
}

export function MergeTool({ tool }: MergeToolProps) {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false); // For animation
    const [countdown, setCountdown] = useState(0); // For animation
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [mergeStats, setMergeStats] = useState({ files: 0, pages: 0, size: 0 });
    const [customFileName, setCustomFileName] = useState('');

    // Advanced Properties State
    const [properties, setProperties] = useState<MergeProperties>({
        paperSize: 'a4',
        orientation: 'portrait',
        normalize: false,
        pageNumbers: false,
        blankPage: false
    });

    // Generate preview for a single file
    const generatePreview = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/tools/preview`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                return result.image;
            }
        } catch (e) {
            console.error("Preview generation failed", e);
        }
        return null;
    }

    const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
        // Convert to PDFFile structure immediately
        const newFilesPromises = selectedFiles.map(async (file) => {
            const pdfFile: PDFFile = {
                id: `file - ${Date.now()} -${Math.random()} `,
                name: file.name,
                size: file.size,
                file
            };
            return pdfFile;
        });

        const newFiles = await Promise.all(newFilesPromises);
        setFiles(prev => [...prev, ...newFiles]);
        setError('');

        // Generate previews asynchronously
        newFiles.forEach(async (pdfFile) => {
            const preview = await generatePreview(pdfFile.file);
            if (preview) {
                setFiles(currentFiles =>
                    currentFiles.map(f => f.id === pdfFile.id ? { ...f, previewUrl: preview } : f)
                );
            }
        });

    }, []);

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleDragEnd = useCallback((result: any) => {
        if (!result.destination) return;

        const items = Array.from(files);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFiles(items);
    }, [files]);

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Please select at least 2 PDF files to merge');
            return;
        }

        setIsProcessing(true);
        setError('');
        setDownloadUrl(null);
        setIsDownloading(false);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file.file);
            });
            const order = files.map((_, index) => index);
            formData.append('order', JSON.stringify(order));
            formData.append('properties', JSON.stringify(properties)); // Pass Properties

            const response = await fetch(`${API_BASE_URL}/api/tools/merge`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success || result.status === 'success') {
                setDownloadUrl(result.downloadUrl);
                setMergeStats({
                    files: result.stats.filesMerged,
                    pages: result.stats.totalPages,
                    size: result.stats.outputSizeKB
                });
                // Default filename: Original name without 'merged_' prefix
                setCustomFileName(files[0].name.replace(/\.pdf$/i, '').replace(/^merged_/, ''));
            } else {
                throw new Error(result.error || 'Merge failed');
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

        // Clean user input: remove any .pdf extension they might have added
        let cleanName = customFileName.replace(/\.pdf$/i, '').trim();
        // Force the suffix

        const finalName = `${cleanName}_pdfbaba.pdf`;

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

    const reset = () => {
        setFiles([]);
        setDownloadUrl(null);
        setError('');
        setCustomFileName('');
        setIsDownloading(false);
    }

    // --- RENDER ---
    return (
        <div className="w-full">
            {/* 1. UPLOAD STATE (If no files) */}
            {files.length === 0 && (
                <FileUploader
                    onFilesSelected={handleFilesSelected}
                    accept={tool.accept}
                    multiple={true}
                />
            )}

            {/* 2. MAIN MERGE UI (Sidebar Layout) */}
            {files.length > 0 && !downloadUrl && (
                <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">

                    {/* LEFT: FILES GRID */}
                    <div className="flex-1">
                        <div className="mb-4 flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <div className="bg-[#e5322d] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                    {files.length}
                                </div>
                                <span className="hidden sm:inline">Files Selected</span>
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={reset} className="text-sm text-red-500 font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors">Clear All</button>
                            </div>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="files" direction="horizontal">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                                    >
                                        {files.map((file, index) => (
                                            <Draggable key={file.id} draggableId={file.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="relative group bg-white border-2 border-transparent hover:border-[#3b469b] rounded-xl shadow-sm hover:shadow-md transition-all aspect-[3/4] flex flex-col cursor-move overflow-hidden"
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                                                            {file.previewUrl ? (
                                                                <img src={file.previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                                                            ) : (
                                                                <FileText className="w-12 h-12 text-gray-300" />
                                                            )}
                                                            {/* Number Badge */}
                                                            <div className="absolute top-2 left-2 bg-[#3b469b] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10">
                                                                {index + 1}
                                                            </div>
                                                        </div>

                                                        {/* Info Footer */}
                                                        <div className="bg-white p-3 border-t border-gray-100">
                                                            <div className="text-xs font-bold text-gray-700 truncate w-full mb-1">{file.name}</div>
                                                            <div className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</div>
                                                        </div>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 shadow-md transition-all z-20"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* ADD MORE CARD */}
                                        <div
                                            onClick={() => document.getElementById('add-more-input')?.click()}
                                            className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center aspect-[3/4] cursor-pointer hover:border-[#e5322d] hover:bg-red-50/50 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-red-100 text-[#e5322d] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <span className="text-2xl font-bold">+</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600 group-hover:text-[#e5322d]">Add More</span>

                                            <input
                                                id="add-more-input" type="file" multiple accept=".pdf" className="hidden"
                                                onChange={(e) => { if (e.target.files) handleFilesSelected(Array.from(e.target.files)) }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* RIGHT: PROPERTIES SIDEBAR */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <Settings className="w-4 h-4 text-gray-500" />
                                Merge Options
                            </h3>

                            {/* OPTION 1: NORMALIZE */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                    <input type="checkbox"
                                        checked={properties.normalize}
                                        onChange={(e) => setProperties(p => ({ ...p, normalize: e.target.checked }))}
                                        className="w-4 h-4 text-[#3b469b] rounded border-gray-300 focus:ring-[#3b469b]"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">Resize Pages</span>
                                </label>

                                {properties.normalize && (
                                    <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <select
                                            value={properties.paperSize}
                                            onChange={(e) => setProperties(p => ({ ...p, paperSize: e.target.value as any }))}
                                            className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3b469b]"
                                        >
                                            <option value="a4">A4 (Standard)</option>
                                            <option value="letter">US Letter</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setProperties(p => ({ ...p, orientation: 'portrait' }))}
                                                className={`flex-1 text-center text-xs py-1.5 rounded-lg border transition-all ${properties.orientation === 'portrait' ? 'bg-[#3b469b] text-white border-[#3b469b]' : 'bg-white text-gray-600 border-gray-200'}`}
                                            >
                                                Portrait
                                            </button>
                                            <button
                                                onClick={() => setProperties(p => ({ ...p, orientation: 'landscape' }))}
                                                className={`flex-1 text-center text-xs py-1.5 rounded-lg border transition-all ${properties.orientation === 'landscape' ? 'bg-[#3b469b] text-white border-[#3b469b]' : 'bg-white text-gray-600 border-gray-200'}`}
                                            >
                                                Landscape
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* OPTION 2: PAGE NUMBERS */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox"
                                        checked={properties.pageNumbers}
                                        onChange={(e) => setProperties(p => ({ ...p, pageNumbers: e.target.checked }))}
                                        className="w-4 h-4 text-[#3b469b] rounded border-gray-300 focus:ring-[#3b469b]"
                                    />
                                    <span className="text-sm text-gray-700">Add Page Numbers</span>
                                </label>
                                <p className="text-[10px] text-gray-400 pl-6 mt-0.5">Footer: "Page 1 of 5"</p>
                            </div>

                            {/* OPTION 3: BLANK PAGE */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox"
                                        checked={properties.blankPage}
                                        onChange={(e) => setProperties(p => ({ ...p, blankPage: e.target.checked }))}
                                        className="w-4 h-4 text-[#3b469b] rounded border-gray-300 focus:ring-[#3b469b]"
                                    />
                                    <span className="text-sm text-gray-700">Add Blank Page</span>
                                </label>
                                <p className="text-[10px] text-gray-400 pl-6 mt-0.5">Between merged files</p>
                            </div>

                            <button
                                onClick={handleMerge}
                                disabled={files.length < 2 || isProcessing}
                                className={`w-full py-3 rounded-xl text-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                            ${files.length < 2 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#e5322d] hover:bg-[#d42d29] hover:shadow-lg hover:-translate-y-0.5'}
                        `}
                            >
                                {isProcessing ? (
                                    <>Merging...</>
                                ) : (
                                    <>Merge {files.length} PDFs <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-xs text-red-600">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* 3. DOWNLOAD STATE (Result) */}
            {downloadUrl && (
                <div className="text-center animate-in fade-in zoom-in-95 max-w-2xl mx-auto h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileCheck className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Merge Complete!</h2>
                    <p className="text-gray-500 mb-6 text-sm">Your {mergeStats.files} files have been combined successfully.</p>

                    {/* RENAME CARD */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-left">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Save File As
                        </label>
                        <div className="relative flex items-center max-w-lg">
                            <input
                                type="text"
                                value={customFileName}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                className="w-full text-base font-bold text-gray-800 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 pr-24 focus:border-[#3b469b] focus:outline-none transition-all shadow-sm"
                                placeholder="merged_document"
                            />
                            <div className="absolute right-4 text-xs font-bold text-gray-400 pointer-events-none">_pdfbaba.pdf</div>
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
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={reset}
                            className="px-5 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-base hover:bg-gray-200 transition-colors"
                        >
                            New Merge
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
                        <div>
                            <span className="block font-bold text-gray-800 text-lg">{mergeStats.pages}</span>
                            Total Pages
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800 text-lg">{mergeStats.size} KB</span>
                            Total Size
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800 text-lg">{properties.normalize ? properties.paperSize.toUpperCase() : 'Mixed'}</span>
                            Layout
                        </div>
                    </div>
                </div>
            )}
            {/* SEO Content & Navigation */}
            <div className="max-w-4xl mx-auto mt-20 px-4 space-y-12">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">
                    <article className="prose prose-lg max-w-none">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 font-display">
                            Merge PDF Files Online for Free
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            PDFBaba's <strong>Merge PDF</strong> tool is the simplest way to combine multiple PDF documents into a single file.
                            Whether you're organizing reports, combining invoices, or creating a unified portfolio, our tool makes it fast and easy.
                            Drag and drop your files, rearrange them, and merge in seconds.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-[#3b469b] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                                    How to Merge
                                </h3>
                                <ol className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Select Files:</strong> Upload multiple PDFs from your computer or drag them in.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Reorder:</strong> Drag and drop the page thumbnails to arrange the order.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Customize:</strong> Add blank pages between files or normalize page sizes.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Merge:</strong> Click "Merge PDF" to combine them into one document.</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                    Advanced Options
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Normalize Pages:</strong> Resize all pages to the same standard size (A4/Letter).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Page Numbers:</strong> Automatically add page numbers to the footer.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Secure Processing:</strong> Files are processed safely and deleted after use.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </article>
                </div>
                <RelatedTools currentTool="merge-pdf" />
            </div>
        </div>
    );
}

