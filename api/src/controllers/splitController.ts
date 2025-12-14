import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export const splitPDF = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const files = req.files as Express.Multer.File[];
        const inputPath = files[0].path;

        // Parse properties properly
        let properties = {};
        if (req.body.properties) {
            try {
                properties = JSON.parse(req.body.properties);
            } catch (e) {
                properties = {};
            }
        }

        const timestamp = Date.now();
        const originalName = files[0].originalname.replace('.pdf', '');
        const outputFilename = `split_${timestamp}_${originalName}.pdf`;
        const outputPath = path.join(process.cwd(), '../processed', outputFilename);

        const pythonScript = path.join(process.cwd(), '../pdf-engine/main.py');

        // Construct command
        // python main.py split --inputs "..." --output "..." --params '{"range": "..."}'

        // Escape double quotes for Windows command line: " becomes \"
        const jsonParams = JSON.stringify(properties).replace(/"/g, '\\"');
        const command = `python "${pythonScript}" split --inputs "${inputPath}" --output "${outputPath}" --params "${jsonParams}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({ error: 'Split failed', details: stderr });
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
                        error: result.message || 'Split failed'
                    });
                }
            } catch (e) {
                console.error('JSON Parse Error:', e, stdout);
                res.status(500).json({ error: 'Invalid response from engine' });
            }
        });

    } catch (error) {
        console.error('Split controller error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
