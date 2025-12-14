
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import archiver from 'archiver';

// Trigger restart
export const convertPdfToImage = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = req.files as Express.Multer.File[];
        const file = files[0]; // Process one PDF at a time for now
        const timestamp = Date.now();
        const baseName = path.parse(file.originalname).name;

        // Output directory for images (temp)
        const tempOutputDir = path.join(__dirname, `../../uploads/temp_${timestamp}`);
        if (!fs.existsSync(tempOutputDir)) {
            fs.mkdirSync(tempOutputDir, { recursive: true });
        }

        // Properties from frontend
        let properties: any = {};
        if (req.body.properties) {
            try {
                properties = JSON.parse(req.body.properties);
            } catch (e) {
                properties = req.body.properties; // Might be object already
            }
        }

        const params = JSON.stringify({
            format: properties.format || 'jpg',
            dpi: properties.dpi || 150,
            color: properties.color || 'color',
            pages: properties.pages || 'all'
        });

        // Command to run Python script via main.py
        // We use the same virtual env or python path as other tools
        const pythonScript = path.join(__dirname, '../../../pdf-engine/main.py');
        const command = `python "${pythonScript}" pdf-to-image --inputs "${file.path}" --output "${tempOutputDir}" --params "${params.replace(/"/g, '\\"')}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({ error: 'Conversion failed', details: stderr });
            }

            try {
                // Parse JSON output from Python
                // stdout might contain other logs, look for the JSON line
                const lines = stdout.split('\n');
                let result = null;
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.status === 'success' && parsed.tool === 'pdf-to-image') {
                            result = parsed;
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (!result) {
                    return res.status(500).json({ error: 'Failed to parse engine output' });
                }

                const generatedFiles = result.files as string[];
                const fileCount = generatedFiles.length;

                // Prepare final download artifact
                const downloadsDir = path.join(process.cwd(), '../processed');
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir, { recursive: true });
                }

                let finalDownloadUrl = '';
                let outputSize = 0;

                // If single file, move and serve
                if (fileCount === 1) {
                    const srcPath = generatedFiles[0];
                    const fileName = path.basename(srcPath);
                    const destPath = path.join(downloadsDir, fileName);

                    fs.copyFileSync(srcPath, destPath);
                    finalDownloadUrl = `/api/tools/download/${fileName}`;
                    outputSize = fs.statSync(destPath).size / 1024;
                }
                // If multiple files, ZIP them
                else {
                    const zipName = `${baseName}_pdfbaba.zip`;
                    const zipPath = path.join(downloadsDir, zipName);

                    const output = fs.createWriteStream(zipPath);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    await new Promise<void>((resolve, reject) => {
                        output.on('close', resolve);
                        archive.on('error', reject);
                        archive.pipe(output);

                        generatedFiles.forEach(f => {
                            archive.file(f, { name: path.basename(f) });
                        });

                        archive.finalize();
                    });

                    finalDownloadUrl = `/api/tools/download/${zipName}`;
                    outputSize = fs.statSync(zipPath).size / 1024;
                }

                // Cleanup temp dir
                try {
                    fs.rmSync(tempOutputDir, { recursive: true, force: true });
                } catch (e) { console.error("Cleanup error", e); }


                res.json({
                    success: true,
                    downloadUrl: finalDownloadUrl,
                    stats: {
                        totalFiles: fileCount,
                        outputSizeKB: Math.round(outputSize * 100) / 100
                    }
                });

            } catch (err: any) {
                console.error("Processing error", err);
                res.status(500).json({ error: 'Internal processing error', message: err.message });
            }
        });

    } catch (error: any) {
        console.error("Controller error", error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
};
