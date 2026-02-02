import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3301;

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://homelab_user:homelab_password@localhost:5433/homelab_db'
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Sediakan file statis dari folder dist
app.use(express.static(path.join(__dirname, 'dist')));

// Pastikan skema database ada
async function ensureDatabaseSchema() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database schema ensured');
    } catch (err) {
        console.error('Error ensuring database schema:', err);
    } finally {
        client.release();
    }
}

// API Endpoints
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM projects ORDER BY updated_at DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json(result.rows[0].data);
        } else {
            res.json({ projects: [] });
        }
    } catch (err) {
        console.error('Error reading projects from DB:', err);
        res.status(500).json({ error: 'Failed to read data from database' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { projects } = req.body;
        // Kita simpan sebagai satu baris yang berisi seluruh list project (mengikuti logic lama)
        // Atau buat baris baru setiap update. Di sini kita update baris tunggal untuk konsistensi dengan frontend lama.
        await pool.query('BEGIN');
        await pool.query('DELETE FROM projects');
        await pool.query('INSERT INTO projects (data) VALUES ($1)', [JSON.stringify({ projects })]);
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error saving projects to DB:', err);
        res.status(500).json({ error: 'Failed to save data to database' });
    }
});

// Fallback untuk semua route lain (SPA)
app.use(async (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    try {
        res.sendFile(indexPath);
    } catch {
        res.status(404).send('Aplikasi belum di-build. Jalankan "npm run build" terlebih dahulu.');
    }
});

ensureDatabaseSchema().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});
