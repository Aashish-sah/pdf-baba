import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

import toolRoutes from './routes/toolRoutes';

app.use(cors());
app.use(express.json());

app.use('/api/tools', toolRoutes);

app.get('/health', (req, res) => {
    res.send('PDF Baba API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
