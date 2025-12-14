import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

export const analyzePDF = async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const files = req.files as Express.Multer.File[];
        const inputPath = files[0].path;

        const pythonScript = path.join(process.cwd(), '../pdf-engine/main.py');
        const command = `python3 "${pythonScript}" analyze --inputs "${inputPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return res.status(500).json({ error: 'Analysis failed', details: stderr });
            }

            try {
                const result = JSON.parse(stdout);

                if (result.status === 'success') {
                    res.json({
                        success: true,
                        stats: result.stats
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: result.message || 'Analysis failed'
                    });
                }
            } catch (e) {
                console.error('JSON Parse Error:', e, stdout);
                res.status(500).json({ error: 'Invalid response from engine' });
            }
        });

    } catch (error) {
        console.error('Analyze controller error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
