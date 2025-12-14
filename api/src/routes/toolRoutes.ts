import { Router } from 'express';
import multer from 'multer';
import { mergePDFs } from '../controllers/mergeController';
import { compressPDF } from '../controllers/compressController';
import { splitPDF } from '../controllers/splitController';
import { analyzePDF } from '../controllers/analyzeController';
import { imageToPdf } from '../controllers/imageToPdfController';
import { generatePreview } from '../controllers/previewController';
import { convertPdfToImage } from '../controllers/pdfToImageController';
import { convertPdfToWord } from '../controllers/pdfToWordController';
import path from 'path';
import fs from 'fs';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/merge', upload.array('files'), mergePDFs);
router.post('/compress', upload.array('files'), compressPDF);
router.post('/split', upload.array('files'), splitPDF);
router.post('/analyze', upload.array('files'), analyzePDF);
router.post('/image-to-pdf', upload.array('files'), imageToPdf);
router.post('/pdf-to-image', upload.array('files'), convertPdfToImage);
router.post('/pdf-to-word', upload.array('files'), convertPdfToWord);
router.post('/preview', upload.single('file'), generatePreview);


router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    // Allow overriding the download filename via query param
    const downloadName = (req.query.name as string) || filename;
    const filepath = path.join(process.cwd(), '../processed', filename);

    if (fs.existsSync(filepath)) {
        res.download(filepath, downloadName);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});


export default router;
