import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

export const imageToPdf = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = req.files as Express.Multer.File[];
        // Inputs are just the list of files. 
        // Logic: Frontend sends files. Backend saves them.
        // Frontend sends 'properties' JSON with 'pages' array.
        // 'pages' items have 'index'. index refers to req.files[index].
        // We pass ALL file paths to python. params['pages'] maps indices to these paths.

        const inputPaths = files.map(f => f.path);

        let properties = {};
        if (req.body.properties) {
            try {
                properties = JSON.parse(req.body.properties);
            } catch (e) {
                properties = {};
            }
        }

        const timestamp = Date.now();
        // Use first file name as base if not provided otherwise?
        const originalName = files[0].originalname.replace(/\.[^/.]+$/, "");
        const outputFilename = `img2pdf_${timestamp}_${originalName}.pdf`;
        const outputPath = path.join(process.cwd(), '../processed', outputFilename);

        const pythonScript = path.join(process.cwd(), '../pdf-engine/main.py');

        // Escape paths for shell
        const inputsArgs = inputPaths.map(p => `"${p}"`).join(' ');

        // Escape JSON
        const jsonParams = JSON.stringify(properties).replace(/"/g, '\\"');

        const command = `python "${pythonScript}" image-to-pdf --inputs ${inputsArgs} --output "${outputPath}" --params "${jsonParams}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({ error: 'Conversion failed', details: stderr });
            }

            try {
                const result = JSON.parse(stdout);

                if (result.status === 'success') {
                    res.json({
                        success: true,
                        downloadUrl: `/api/tools/download/${outputFilename}`,
                        stats: result.stats
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: result.message || 'Conversion failed'
                    });
                }
            } catch (e) {
                console.error('JSON Parse Error:', e, stdout);
                res.status(500).json({ error: 'Invalid response from engine' });
            }
        });

    } catch (error) {
        console.error('ImageToPdf controller error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
