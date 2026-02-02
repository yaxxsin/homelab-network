import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import connectPg from 'connect-pg-simple';
import axios from 'axios';

const { Pool } = pkg;
const PostgresStore = connectPg(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3301;

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://homelab_user:homelab_password@localhost:5433/homelab_db'
});

// Passport Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, emails, displayName, photos } = profile;
        const email = emails[0].value;
        const avatar = photos[0]?.value;

        let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [id, email]);

        if (result.rows.length === 0) {
            result = await pool.query(
                'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, email, displayName, avatar]
            );
        } else if (!result.rows[0].google_id) {
            // Update existing local user with google_id
            result = await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3 RETURNING *', [id, avatar, email]);
        }

        return done(null, result.rows[0]);
    } catch (err) {
        return done(err);
    }
}));

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return done(null, false, { message: 'Incorrect email or password.' });

        const user = result.rows[0];
        if (!user.password) return done(null, false, { message: 'Please login with Google.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Incorrect email or password.' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

app.use(session({
    store: new PostgresStore({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'homelab_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Sediakan file statis dari folder dist
app.use(express.static(path.join(__dirname, 'dist')));

// Pastikan skema database ada
async function ensureDatabaseSchema() {
    let client;
    try {
        client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS session (
                sid varchar NOT NULL PRIMARY KEY COLLATE "default",
                sess json NOT NULL,
                expire timestamp(6) NOT NULL
            ) WITH (OIDS=FALSE);
        `);

        await client.query(`
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

        // Safeguard: Ensure password column exists if table was created earlier
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');

        await client.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Safeguard: Ensure user_id column exists if table existed before multi-user support
        await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;');

        console.log('Database schema ensured');
    } catch (err) {
        console.error('Error ensuring database schema (is PostgreSQL running?):', err.message);
    } finally {
        if (client) client.release();
    }
}

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

app.get('/auth/me', (req, res) => {
    res.json(req.user || null);
});

app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true });
    });
});

app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });
        req.logIn(user, (err) => {
            if (err) return next(err);
            res.json(user);
        });
    })(req, res, next);
});

app.post('/auth/register', async (req, res) => {
    const { email, password, name, token } = req.body;

    if (!email || !password || !token) {
        return res.status(400).json({ error: 'Email, password, and CAPTCHA are required' });
    }

    // Verify Cloudflare Turnstile token
    try {
        const secretKey = process.env.TURNSTILE_SECRET_KEY;
        if (secretKey) {
            const verifyRes = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                secret: secretKey,
                response: token
            });
            if (!verifyRes.data.success) return res.status(400).json({ error: 'CAPTCHA verification failed' });
        }

        // Check if user already exists
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`;

        const result = await pool.query(
            'INSERT INTO users (email, password, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, hashedPassword, name, avatar]
        );

        req.logIn(result.rows[0], (err) => {
            if (err) return res.status(500).json({ error: 'Login after registration failed' });
            res.json(result.rows[0]);
        });
    } catch (err) {
        console.error('Registration Error Details:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        res.status(500).json({ error: `Registration error: ${err.message}` });
    }
});

// API Endpoints
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
};

app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
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

app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
        const { projects } = req.body;
        await pool.query('BEGIN');
        await pool.query('DELETE FROM projects WHERE user_id = $1', [req.user.id]);
        await pool.query('INSERT INTO projects (user_id, data) VALUES ($1, $2)', [req.user.id, JSON.stringify({ projects })]);
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
    res.sendFile(indexPath);
});

ensureDatabaseSchema().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});
