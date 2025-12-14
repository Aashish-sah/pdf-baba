import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Upload, X, Plus, ArrowUp, ArrowDown, Image as ImageIcon, Settings, Move, Trash2, Download } from 'lucide-react';
import { RelatedTools } from './RelatedTools';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

// Types
interface PageItem {
    id: string;
    type: 'image' | 'blank';
    file?: File;
    previewUrl?: string;
    originalName?: string;
}

interface PdfSettings {
    pageSize: 'a4' | 'letter' | 'legal' | 'auto';
    orientation: 'portrait' | 'landscape' | 'auto';
    margin: 'none' | 'small' | 'medium' | 'large';
    fit: 'fit' | 'fill' | 'original';
}

const ImageToPdfTool = () => {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [settings, setSettings] = useState<PdfSettings>({
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 'none',
        fit: 'fit'
    });
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [filename, setFilename] = useState('document');


    // Initial load/paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.items) {
                const items = e.clipboardData.items;
                const newFiles: File[] = [];
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) newFiles.push(file);
                    }
                }
                if (newFiles.length > 0) {
                    addFiles(newFiles);
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    const addFiles = (files: File[]) => {
        const newPages: PageItem[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            file,
            previewUrl: URL.createObjectURL(file), // create blob url
            originalName: file.name
        }));
        setPages(prev => [...prev, ...newPages]);
        if (!selectedPageId && newPages.length > 0) {
            setSelectedPageId(newPages[0].id);
        }

        // Update default filename if it's the first batch and generic
        if (files.length > 0 && (filename === 'document' || !filename)) {
            setFilename(files[0].name.replace(/\.[^/.]+$/, ""));
        }

        setDownloadUrl(null); // Reset result
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        addFiles(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': [],
            'image/bmp': [],
            'image/tiff': [],
            'image/gif': []
        }
    });

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(pages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPages(items);
    };

    const addBlankPage = (index?: number) => {
        const newPage: PageItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'blank'
        };
        const items = Array.from(pages);
        const insertAt = index !== undefined ? index + 1 : items.length;
        items.splice(insertAt, 0, newPage);
        setPages(items);
        setSelectedPageId(newPage.id);
    };

    const removePage = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setPages(prev => prev.filter(p => p.id !== id));
        if (selectedPageId === id) setSelectedPageId(null);
    };

    const handleConvert = async () => {
        if (pages.length === 0) return;
        setIsProcessing(true);
        setError('');

        const formData = new FormData();

        // Prepare pages config and append files
        // We need to map pages to files indices properly.
        // Let's create a list of *image files* to upload (in order of appearance? or just all distinct files?)
        // Simpler: Just append ALL image files found in 'pages'.
        // And construct 'pagesConfig' that references them by index.

        const imageFiles: File[] = [];
        const pagesConfig = pages.map(p => {
            if (p.type === 'image' && p.file) {
                // Check if file already added? No, simplify: duplicate files = duplicate uploads is fine for now.
                // Or better: strict index mapping.
                const fileIndex = imageFiles.length;
                imageFiles.push(p.file);
                return { type: 'image', index: fileIndex };
            } else {
                return { type: 'blank' };
            }
        });

        imageFiles.forEach(f => formData.append('files', f));
        formData.append('properties', JSON.stringify({
            pages: pagesConfig,
            pageSize: settings.pageSize,
            orientation: settings.orientation,
            margin: settings.margin,
            fit: settings.fit
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/api/tools/image-to-pdf`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                setDownloadUrl(result.downloadUrl);
                setStats(result.stats);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // ... Download logic (reused from split tool) ...
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
        const finalName = `${filename}_pdfbaba.pdf`;

        const baseUrl = downloadUrl!.startsWith('http') ? downloadUrl! : `${API_BASE_URL}${downloadUrl}`;
        const urlObj = new URL(baseUrl);
        urlObj.searchParams.set('name', finalName);
        const url = urlObj.href;

        a.href = url;
        a.download = finalName;
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }


    const selectedPage = pages.find(p => p.id === selectedPageId) || pages[0];

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 py-6 relative">

            {!pages.length ? (
                // Empty State
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-3xl p-24 text-center cursor-pointer transition-all group",
                        isDragActive ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-red-100">
                        <ImageIcon className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Image to PDF</h3>
                    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                        Convert JPG, PNG, WEBP images to PDF. Drag & Drop them here or paste from clipboard.
                    </p>
                    <button className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">
                        Select Images
                    </button>
                </div>
            ) : !downloadUrl ? (
                // Workspace
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[500px]">

                    {/* Left: Page Selector (Thumbnails) */}
                    <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="font-semibold text-gray-700 whitespace-nowrap">{pages.length} Pages</span>
                            <div {...getRootProps()} className="cursor-pointer text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 whitespace-nowrap">
                                <input {...getInputProps()} />
                                <FilePlus size={16} /> Add Images
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="pages-list">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                            {pages.map((page, index) => (
                                                <Draggable key={page.id} draggableId={page.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedPageId(page.id)}
                                                            className={cn(
                                                                "relative p-3 rounded-xl border-2 cursor-pointer group hover:border-red-200 transition-colors flex items-center gap-4",
                                                                selectedPageId === page.id ? "border-red-500 bg-red-50" : "border-gray-100 bg-white",
                                                                snapshot.isDragging && "shadow-xl ring-2 ring-red-500 rotate-2"
                                                            )}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {index + 1}
                                                            </div>

                                                            <div className="w-16 h-20 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                                                                {page.type === 'blank' ? (
                                                                    <span className="text-[10px] text-gray-400">BLANK</span>
                                                                ) : (
                                                                    <img src={page.previewUrl} className="w-full h-full object-cover" alt="" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-700 truncate">
                                                                    {page.type === 'blank' ? 'Blank Page' : page.originalName}
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={(e) => removePage(page.id, e)}
                                                                className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>

                                                            {/* Actions Popover could go here, for now just basic */}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            <button
                                onClick={() => addBlankPage()}
                                className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <FilePlus size={16} /> Add Blank Page
                            </button>
                        </div>
                    </div>

                    {/* Center: Workspace / Preview */}
                    <div className="flex-1 bg-gray-100 rounded-2xl flex flex-col hidden lg:flex">
                        <div className="bg-white p-4 rounded-t-2xl border-b border-gray-200 font-semibold text-gray-700 flex justify-between">
                            <span>Preview</span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Live
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 overflow-hidden relative">
                            {selectedPage ? (
                                <div
                                    className="bg-white shadow-2xl transition-all duration-300 relative flex items-center justify-center mx-auto"
                                    style={{
                                        height: 'auto',
                                        maxHeight: '100%',
                                        width: 'auto',
                                        maxWidth: '100%',
                                        aspectRatio:
                                            settings.pageSize === 'auto' ? 'auto' :
                                                (settings.orientation === 'landscape'
                                                    ? (settings.pageSize === 'letter' ? '279/216' : '297/210')
                                                    : (settings.pageSize === 'letter' ? '216/279' : '210/297')
                                                ),
                                    }}
                                >
                                    {/* Aspect Ratio Correction wrapper if needed, or just apply style simply */}
                                    <div
                                        className="absolute inset-0 pointer-events-none border border-blue-200 opacity-50 z-10"
                                        style={{ margin: settings.margin === 'none' ? 0 : settings.margin === 'small' ? '20px' : '40px' }}
                                    />

                                    {selectedPage.type === 'blank' ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-gray-300 font-bold text-4xl opacity-20 -rotate-45 whitespace-nowrap">BLANK PAGE</div>
                                        </div>
                                    ) : (
                                        <img
                                            src={selectedPage.previewUrl}
                                            className="block"
                                            style={{
                                                objectFit: settings.fit === 'fit' ? 'contain' : settings.fit === 'fill' ? 'cover' : 'none',
                                                padding: settings.margin === 'none' ? 0 : settings.margin === 'small' ? '20px' : '40px',
                                                // Key fix: Ensure image stays within container
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                width: settings.fit === 'fill' ? '100%' : 'auto',
                                                height: settings.fit === 'fill' ? '100%' : 'auto',
                                            }}
                                            alt="Preview"
                                        />
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400">Select a page to preview</p>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex justify-center">
                            <button
                                onClick={handleConvert}
                                disabled={isProcessing}
                                className="px-12 py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 min-w-[200px]"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Convert to PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Settings */}
                    <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col flex-shrink-0">
                        <div className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-6">
                            <Settings className="text-red-600" /> Settings
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Page Size */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Page Size</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-red-100 outline-none"
                                    value={settings.pageSize}
                                    onChange={(e) => setSettings(s => ({ ...s, pageSize: e.target.value as any }))}
                                >
                                    <option value="a4">A4</option>
                                    <option value="letter">Letter</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>

                            {/* Orientation */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Orientation</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-red-100 outline-none"
                                    value={settings.orientation}
                                    onChange={(e) => setSettings(s => ({ ...s, orientation: e.target.value as any }))}
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>

                            {/* Margins */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Margin</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-red-100 outline-none"
                                    value={settings.margin}
                                    onChange={(e) => setSettings(s => ({ ...s, margin: e.target.value as any }))}
                                >
                                    <option value="none">No Margin (0px)</option>
                                    <option value="small">Small (20px)</option>
                                    <option value="medium">Medium (40px)</option>
                                    <option value="large">Large (72px)</option>
                                </select>
                            </div>

                            {/* Image Fit */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image Fit</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-red-100 outline-none"
                                    value={settings.fit}
                                    onChange={(e) => setSettings(s => ({ ...s, fit: e.target.value as any }))}
                                >
                                    <option value="fit">Fit to Page</option>
                                    <option value="fill">Fill Page (Crop)</option>
                                    <option value="original">Original Size</option>
                                </select>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                // Success State
                <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="w-full max-w-sm text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <ImageIcon size={40} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">PDF Ready!</h3>
                        <p className="text-gray-500 text-lg mb-8">
                            Your images have been converted successfully.
                        </p>

                        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm w-full">
                            <div className="flex justify-between text-sm mb-3">
                                <span className="text-gray-500">Total Pages</span>
                                <span className="font-semibold text-gray-900">{stats?.totalPages}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-4">
                                <span className="text-gray-500">Total Size</span>
                                <span className="font-semibold text-gray-900">{stats?.outputSizeKB} KB</span>
                            </div>

                            {/* Rename Input */}
                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-left text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    File Name
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none font-medium"
                                        placeholder="Enter filename"
                                    />
                                    <span className="text-gray-500 font-medium text-sm">.pdf</span>
                                </div>
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
                                    setIsDownloading(false);
                                }}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Convert More
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content & SEO */}
            <div className="max-w-4xl mx-auto mt-20 px-4 space-y-12">

                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">
                    <article className="prose prose-lg max-w-none">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 font-display">
                            Convert Images to PDF Online for Free
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            PDFBaba's <strong>Image to PDF</strong> converter is the easiest way to combine multiple images into a single, professional PDF document.
                            Whether you have JPGs, PNGs, WEBPs, or BMPs, our tool preserves the quality of your photos while organizing them into a shareable file.
                            Perfect for creating portfolios, archiving receipts, or sharing photo albums.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                                    How to Convert
                                </h3>
                                <ol className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Upload Images:</strong> Drag & drop your files or Paste (Ctrl+V) them directly.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Arrange:</strong> Drag thumbnails to reorder. Add blank pages if needed.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Customize:</strong> Set page size (A4, Letter), orientation, and margins.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                        <span><strong>Download:</strong> Click "Convert to PDF", name your file, and save.</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                    Layout Options
                                </h3>
                                <ul className="space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Fit to Page:</strong> Ensures entire image is visible without cropping.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Fill Page:</strong> Expands image to cover the full page (may crop edges).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                        <span><strong>Auto Orientation:</strong> Automatically rotates pages to match landscape photos.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </article>
                </div>
                <RelatedTools currentTool="jpg-to-pdf" />
            </div>

            {error && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <X size={20} className="cursor-pointer" onClick={() => setError('')} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImageToPdfTool;
