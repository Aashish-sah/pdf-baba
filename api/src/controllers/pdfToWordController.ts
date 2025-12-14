
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export const convertPdfToWord = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const file = (req.files as Express.Multer.File[])[0];
        const timestamp = Date.now();
        const baseName = path.parse(file.originalname).name;

        // Output file
        // Naming convention: <base-name>_pdfbaba.docx
        const outputFilename = `${baseName}_pdfbaba.docx`;
        const outputDir = path.join(process.cwd(), '../processed');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, outputFilename);

        // Properties
        let properties: any = {};
        if (req.body.properties) {
            try {
                properties = JSON.parse(req.body.properties);
            } catch (e) {
                properties = req.body.properties;
            }
        }

        // Params for Python
        const params = JSON.stringify({
            pages: properties.pages || 'all',
            mode: properties.mode || 'editable' // Pass mode if needed later
        });

        // Command
        const pythonScript = path.join(__dirname, '../../../pdf-engine/main.py');
        const command = `python "${pythonScript}" pdf-to-word --inputs "${file.path}" --output "${outputPath}" --params "${params.replace(/"/g, '\\"')}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({ error: 'Conversion failed', details: stderr });
            }

            try {
                // Parse stdout for success JSON
                const lines = stdout.split('\n');
                let result = null;
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.status === 'success' && parsed.tool === 'pdf-to-word') {
                            result = parsed;
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (!result) {
                    return res.status(500).json({ error: 'Failed to parse engine output' });
                }

                // Return download URL
                // e.g. /api/tools/download/<filename>
                res.json({
                    success: true,
                    downloadUrl: `/api/tools/download/${outputFilename}`,
                    stats: {
                        outputSizeKB: fs.statSync(outputPath).size / 1024
                    }
                });

            } catch (e: any) {
                console.error("Processing error", e);
                res.status(500).json({ error: 'Internal processing error' });
            }
        });

    } catch (error: any) {
        console.error("Controller error", error);
        res.status(500).json({ error: 'Server error' });
    }
};
