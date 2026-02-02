import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3300;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Sediakan file statis dari folder dist
app.use(express.static(path.join(__dirname, 'dist')));

// Pastikan direktori data ada
async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            await fs.writeFile(DATA_FILE, JSON.stringify({ projects: [] }));
        }
    } catch (err) {
        console.error('Error ensuring data file:', err);
    }
}

// API Endpoints
app.get('/api/projects', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { projects } = req.body;
        await fs.writeFile(DATA_FILE, JSON.stringify({ projects }, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Redirect semua route lain ke index.html (untuk SPA)
app.get('*', async (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    try {
        await fs.access(indexPath);
        res.sendFile(indexPath);
    } catch {
        res.status(404).send('Aplikasi belum di-build. Jalankan "npm run build" terlebih dahulu.');
    }
});

ensureDataFile().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});
