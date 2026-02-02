import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgres://homelab_user:homelab_password@localhost:5433/homelab_db'
});

async function setup() {
    console.log('Ensuring database schema manually...');
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS session (sid varchar NOT NULL COLLATE "default", sess json NOT NULL, expire timestamp(6) NOT NULL) WITH (OIDS=FALSE);');
        await pool.query('ALTER TABLE IF EXISTS session DROP CONSTRAINT IF EXISTS session_pkey; ');
        await pool.query('ALTER TABLE IF EXISTS session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                google_id TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                name TEXT,
                avatar_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('SUCCESS: Schema created/verified.');
        process.exit(0);
    } catch (err) {
        console.error('FAILED: Schema setup error:', err.message);
        process.exit(1);
    }
}

setup();
