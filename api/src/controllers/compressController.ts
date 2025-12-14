import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const compressPDF = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Please provide a PDF file' });
        }

        const inputFile = files[0];
        const inputPath = inputFile.path;

        // Parse options (targetSize or level)
        const options = req.body.options ? JSON.parse(req.body.options) : {};

        const outputFilename = `compressed-${Date.now()}.pdf`;
        const outputDir = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, outputFilename);

        // Call Python Engine
        const enginePath = path.resolve(process.cwd(), '../pdf-engine/main.py');

        // Arguments: tool, --inputs, --output, --params
        const processArgs = [
            enginePath,
            'compress',
            '--inputs', inputPath,
            '--output', outputPath
        ];

        // Only pass params if we have specific options
        // If targetSize is provided, pass it. If not, don't pass it, and Python will use default.
        if (options.targetSize) {
            processArgs.push('--params', JSON.stringify({ target_size_kb: options.targetSize }));
        }

        console.log('Spawning python process:', 'python', processArgs.join(' '));

        const pythonProcess = spawn('python3', processArgs);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);

            // Cleanup input file
            try { fs.unlinkSync(inputPath); } catch (e) { }

            if (code !== 0) {
                console.error('Python Error:', errorString);
                return res.status(500).json({ error: 'Compression failed', details: errorString });
            }

            try {
                const result = JSON.parse(dataString);
                if (result.status === 'success') {
                    // Send the file
                    // We send original name (or just output.pdf) and let frontend handle naming via a.download
                    res.download(outputPath, inputFile.originalname, (err) => {
                        if (err) {
                            console.error('Download error:', err);
                        }
                        try { fs.unlinkSync(outputPath); } catch (e) { }
                    });
                } else {
                    res.status(500).json({ error: result.message || 'Unknown error' });
                }
            } catch (e) {
                console.error('JSON Parse Error:', dataString);
                if (fs.existsSync(outputPath)) {
                    res.download(outputPath, `compressed_${inputFile.originalname}`, () => {
                        try { fs.unlinkSync(outputPath); } catch (e) { }
                    });
                } else {
                    res.status(500).json({ error: 'Failed to access compressed file' });
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
