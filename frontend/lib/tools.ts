// Define the tool config type to ensure compatibility
export interface ToolContent {
    howTo: { step: number; title: string; description: string; color: string }[];
    faqs: { question: string; answer: string }[];
}

export interface ToolConfig {
    title: string;
    description: string;
    category: string;
    accept: Record<string, string[]>;
    multiple: boolean;
    maxFiles: number;
    buttonLabel: string;
    processVerb: string;
    href: string;
    visible?: boolean;
    popular?: boolean; // Show on home page
    color?: string; // Tailwind class for icon background
    icon?: any; // Lucide icon name (we'll map this in component)
    content?: ToolContent;
}

export const TOOLS_CONFIG: Record<string, ToolConfig> = {
    // --- ORGANIZE PDF ---
    'merge-pdf': {
        title: 'Merge PDF',
        description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
        category: 'organize',
        accept: { "application/pdf": [".pdf"] },
        multiple: true,
        maxFiles: 10,
        buttonLabel: 'Merge PDF',
        processVerb: 'Merging',
        href: '/merge-pdf',
        popular: true,
        color: 'bg-red-500',
        icon: 'Merge',
        content: {
            howTo: [
                { step: 1, title: 'Select PDF files', description: 'Upload the PDF files you want to combine from your computer or drag and drop them.', color: 'text-[#e5322d]' },
                { step: 2, title: 'Reorder files', description: 'Drag and drop the files to change their order. You can also sort by name.', color: 'text-[#3b469b]' },
                { step: 3, title: 'Merge & Download', description: 'Click "Merge PDF" to combine the files. View the result and download your new PDF.', color: 'text-green-600' }
            ],
            faqs: [
                { question: 'How can I merge PDF files for free?', answer: 'Select the PDF files you want to merge or drag and drop them into the file box. The pages will be displayed as thumbnails. You can reorder them if needed. Click "Merge PDF" and download your file.' },
                { question: 'Is it safe to merge PDFs online?', answer: 'Yes, it is 100% safe. We do not store your files. They are processed and deleted from our servers automatically.' },
                { question: 'Can I reorder the pages?', answer: 'Yes! Once you upload your PDFs, you can drag and drop the thumbnails to arrange them in any order you like before merging.' }
            ]
        }
    },
    'split-pdf': {
        title: 'Split PDF',
        description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
        category: 'organize',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Split PDF',
        processVerb: 'Splitting',
        href: '/split-pdf',
        popular: true,
        color: 'bg-red-500',
        icon: 'Split'
    },
    'reorder-pdf': {
        title: 'Scan to PDF',
        description: 'Capture document scans from your mobile device and send them instantly to your browser.',
        category: 'organize',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Reorder PDF',
        processVerb: 'Saving',
        href: '/reorder-pdf',
        color: 'bg-red-500',
        icon: 'Scan'
    },

    // --- OPTIMIZE PDF ---
    'compress-pdf': {
        title: 'Compress PDF',
        description: 'Reduce file size while optimizing for maximal PDF quality.',
        category: 'optimize',
        accept: { "application/pdf": [".pdf"] },
        multiple: true,
        maxFiles: 5,
        buttonLabel: 'Compress PDF',
        processVerb: 'Compressing',
        href: '/compress-pdf',
        popular: true,
        color: 'bg-green-500',
        icon: 'Minimize2',
        content: {
            howTo: [
                { step: 1, title: 'Select PDF file', description: 'Choose your file from the computer or drag & drop it into our PDF Compressor tool.', color: 'text-[#e5322d]' },
                { step: 2, title: 'Compress', description: 'Our engine automatically reduces PDF size by up to 50% while checking pixels for maximum quality.', color: 'text-[#3b469b]' },
                { step: 3, title: 'Download', description: 'Wait for the compressed PDF countdown and download your optimized file instantly.', color: 'text-green-600' }
            ],
            faqs: [
                { question: 'How does PDFBaba compress PDF files?', answer: 'We use advanced logic to scan every pixel. By intelligently reducing DPI and optimizing images, we can compress PDF to 100kb, 200kb, or 1MB without noticeable quality loss.' },
                { question: 'Is it safe to use this PDF Compressor?', answer: '100% Safe. Your files are processed securely in the cloud and are permanently deleted from our servers after 1 hour.' },
                { question: 'Can I compress PDF to 50% of its size?', answer: 'Yes! Our default "Best Quality" mode is designed to strictly target a 50% reduction. If you upload a 10MB file, our tool aims to give you a 5MB result automatically.' }
            ]
        }
    },
    'pdf-to-jpg': {
        title: 'PDF to Image',
        description: 'Convert PDF pages to high-quality images (JPG, PNG, WEBP, etc).',
        category: 'convert',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Convert to Image',
        processVerb: 'Converting',
        href: '/pdf-to-jpg',
        popular: true,
        color: 'bg-yellow-500',
        icon: 'Image'
    },
    'jpg-to-pdf': {
        title: 'Image to PDF',
        description: 'Convert JPG, PNG, WEBP, BMP images to PDF. Advanced layout control.',
        category: 'convert',
        accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"] },
        multiple: true,
        maxFiles: 50,
        buttonLabel: 'Convert to PDF',
        processVerb: 'Converting',
        href: '/jpg-to-pdf',
        popular: true,
        color: 'bg-yellow-500',
        icon: 'FileImage'
    },

    // --- CONVERT PDF ---
    'pdf-to-word': {
        title: 'PDF to Word',
        description: 'Convert your PDF to components documents with incredible accuracy.',
        category: 'convert',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Convert to Word',
        processVerb: 'Converting',
        href: '/pdf-to-word',
        popular: true,
        color: 'bg-blue-50',
        icon: '/tool-icons/pdf-to-word.png?v=3'
    },
    'excel-to-pdf': {
        title: 'Excel to PDF',
        description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
        category: 'convert',
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Convert to PDF',
        processVerb: 'Converting',
        href: '/excel-to-pdf',
        color: 'bg-green-600',
        icon: 'Sheet'
    },
    'html-to-pdf': {
        title: 'HTML to PDF',
        description: 'Convert web pages to PDF documents',
        category: 'convert',
        accept: { "text/html": [".html"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Convert to PDF',
        processVerb: 'Converting',
        href: '/html-to-pdf',
        color: 'bg-gray-600',
        icon: 'Globe'
    },

    // --- EDIT PDF ---
    'edit-pdf': {
        title: 'Edit PDF',
        description: 'Add text, images, shapes and freehand annotations to your PDF document.',
        category: 'edit',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Save Changes',
        processVerb: 'Saving',
        href: '/edit-pdf',
        color: 'bg-amber-500',
        icon: 'PenLine'
    },
    'rotate-pdf': {
        title: 'Rotate PDF',
        description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
        category: 'edit',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Rotate PDF',
        processVerb: 'Rotating',
        href: '/rotate-pdf',
        color: 'bg-amber-500',
        icon: 'RotateCw'
    },
    'watermark-pdf': {
        title: 'Watermark PDF',
        description: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.',
        category: 'edit',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Add Watermark',
        processVerb: 'Processing',
        href: '/watermark-pdf',
        color: 'bg-amber-500',
        icon: 'Stamp'
    },

    // --- SECURE PDF ---
    'protect-pdf': {
        title: 'Protect PDF',
        description: 'Encrypt your PDF with a password to keep sensitive data confidential.',
        category: 'secure',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Protect PDF',
        processVerb: 'Encrypting',
        href: '/protect-pdf',
        color: 'bg-slate-700',
        icon: 'Lock'
    },
    'unlock-pdf': {
        title: 'Unlock PDF',
        description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
        category: 'secure',
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxFiles: 1,
        buttonLabel: 'Unlock PDF',
        processVerb: 'Decrypting',
        href: '/unlock-pdf',
        color: 'bg-slate-500',
        icon: 'Unlock'
    },

};

export type ToolId = keyof typeof TOOLS_CONFIG;
