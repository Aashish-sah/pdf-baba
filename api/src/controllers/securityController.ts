import { Request, Response } from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = util.promisify(exec);

export const protectPDF = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }

        const inputFile = files[0];
        // Clean filename to be safe
        const safeOriginalName = inputFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const outputFilename = `protected_${Date.now()}_${safeOriginalName}`;

        // Ensure processed directory exists
        // Assuming uploads are in api/uploads (processed by multer in route), 
        // we want processed in api/processed (sibling)
        const projectRoot = process.cwd(); // api directory
        const processedDir = path.join(projectRoot, '../processed');

        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        const outputPath = path.join(processedDir, outputFilename);

        // Properties
        let properties: any = {};
        if (req.body.properties) {
            try {
                properties = typeof req.body.properties === 'string' ? JSON.parse(req.body.properties) : req.body.properties;
            } catch (e) {
                res.status(400).json({ success: false, error: 'Invalid properties JSON' });
                return;
            }
        }

        // Pass essential args
        const enginePath = path.resolve(projectRoot, '../pdf-engine/main.py');
        const paramsString = JSON.stringify(properties).replace(/"/g, '\\"');

        const command = `python3 "${enginePath}" protect --inputs "${inputFile.path}" --output "${outputPath}" --params "${paramsString}"`;

        const { stdout, stderr } = await execAsync(command);

        let result;
        try {
            // Find JSON in stdout (in case there are other prints)
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
                result = JSON.parse(jsonStr);
            } else {
                throw new Error("No JSON found in output");
            }
        } catch (e) {
            console.error("Failed to parse Python output:", stdout);
            res.status(500).json({ success: false, error: "Engine returned invalid response", details: stdout });
            return;
        }

        if (result.status === 'success') {
            res.json({
                success: true,
                downloadUrl: `/api/tools/download/${outputFilename}`,
                output: outputFilename
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.message || 'Protection failed'
            });
        }

    } catch (error: any) {
        console.error('Protect Controller Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
