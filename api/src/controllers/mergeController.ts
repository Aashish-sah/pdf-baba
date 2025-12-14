import { Request, Response } from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = util.promisify(exec);

export const mergePDFs = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length < 2) {
            res.status(400).json({
                success: false,
                error: 'Need at least 2 PDF files to merge'
            });
            return;
        }

        // Create a unique temporary directory for this request to avoid collisions
        // or just use the uploaded files directly if they are in a temp folder.
        // The multer upload puts them in `uploads/` usually.

        const filePaths = files.map(f => f.path);

        // Output path
        const outputFilename = `merged_${Date.now()}.pdf`;
        // Ensure processed directory exists
        const processedDir = path.join(path.dirname(files[0].path), '..', 'processed');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }
        const outputPath = path.join(processedDir, outputFilename);

        // Build Command
        // We need to call main.py with tool=merge
        // params header with files list might be cleaner, but main.py merge logic 
        // I wrote expects "input" and "output" but I modified logic to handle files + params
        const order = req.body.order ? JSON.parse(req.body.order) : null;
        const properties = req.body.properties ? JSON.parse(req.body.properties) : {};

        // Pass order inside properties to main.py
        if (order) {
            properties.order = order;
        }

        const enginePath = path.resolve(process.cwd(), '../pdf-engine/main.py');
        const paramsString = JSON.stringify(properties).replace(/"/g, '\\"'); // escape for command line

        // Construct command
        const inputFiles = files.map(f => `"${f.path}"`).join(' ');
        const command = `python "${enginePath}" merge --inputs ${inputFiles} --output "${outputPath}" --params "${paramsString}"`;

        console.log('Merge Command:', command); // Debug log

        console.log("Executing:", command);

        const { stdout, stderr } = await execAsync(command);

        // REMOVED DEBUG LOGGING

        let result;
        try {
            result = JSON.parse(stdout);
        } catch (e) {
            console.error("Failed to parse Python output:", stdout);
            res.status(500).json({ success: false, error: "Engine returned invalid response" });
            return;
        }

        if (result.status === 'success') {
            res.json({
                success: true,
                downloadUrl: `/api/tools/download/${outputFilename}`,
                stats: {
                    filesMerged: result.stats.filesMerged,
                    totalPages: result.stats.totalPages,
                    outputSizeKB: result.stats.outputSizeKB
                },
                files: result.files_merged
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Merge failed'
            });
        }

    } catch (error: any) {
        console.error('Merge Controller Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
