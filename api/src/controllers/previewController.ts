import { Request, Response } from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export const generatePreview = async (req: Request, res: Response) => {
    try {
        const file = req.file as Express.Multer.File;

        if (!file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }

        const enginePath = path.resolve(process.cwd(), '../pdf-engine/main.py');
        const command = `python "${enginePath}" preview --inputs "${file.path}"`;

        const { stdout } = await execAsync(command);
        const result = JSON.parse(stdout);

        if (result.success) {
            res.json({ success: true, image: result.image });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error: any) {
        console.error('Preview Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
