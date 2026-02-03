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
import { io } from 'socket.io-client';

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
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
async function ensureDatabaseSchema(retries = 10) {
    let client;
    while (retries > 0) {
        try {
            client = await pool.connect();
            console.log('Database connected successfully');

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
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');

            await client.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    data JSONB NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // Clean up any projects without a user (legacy data)
            await client.query('DELETE FROM projects WHERE user_id IS NULL');
            await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;');
            // Try to set NOT NULL if it was added without it
            try {
                await client.query('ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;');
            } catch (e) {
                console.log('Could not enforce NOT NULL on user_id yet, likely legacy data exists');
            }

            console.log('Database schema ensured and validated');
            return;
        } catch (err) {
            retries -= 1;
            console.error(`Database connection failed. Retries left: ${retries}. Error: ${err.message}`);
            if (retries === 0) {
                console.error('Final database connection attempt failed. Starting server in degraded mode...');
                return;
            }
            await new Promise(res => setTimeout(res, 3000));
        } finally {
            if (client) client.release();
        }
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
        if (!secretKey) return res.status(500).json({ error: 'Turnstile secret key not configured' });

        const verifyRes = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            secret: secretKey,
            response: token
        });
        if (!verifyRes.data.success) return res.status(400).json({ error: 'CAPTCHA verification failed' });

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
        const projectsToSave = projects || [];
        await pool.query('BEGIN');
        await pool.query('DELETE FROM projects WHERE user_id = $1', [req.user.id]);
        await pool.query('INSERT INTO projects (user_id, data) VALUES ($1, $2)', [req.user.id, JSON.stringify({ projects: projectsToSave })]);
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error saving projects to DB:', err);
        res.status(500).json({ error: 'Failed to save data to database' });
    }
});

// Uptime Kuma Webhook
app.post('/api/webhooks/uptime-kuma', async (req, res) => {
    try {
        const { msg, heartbeat, monitor } = req.body;
        // Uptime Kuma sends heartbeat.status: 1 for UP, 0 for DOWN
        if (!monitor || !heartbeat) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        const monitorName = monitor.name;
        const status = heartbeat.status === 1 ? 'online' : 'offline';
        const monitorId = monitor.id.toString();
        const latency = heartbeat.ping ? `${heartbeat.ping}ms` : null;

        console.log(`Uptime Kuma Webhook: Monitor ${monitorName} (${monitorId}) is now ${status} (Ping: ${latency})`);

        // Update node status in all projects where uptimeKumaId matches
        // Note: In a production app, we might want to be more specific about which user/project
        // But for this homelab tool, updating all occurrences is often what's desired

        const result = await pool.query('SELECT id, user_id, data FROM projects');

        for (const row of result.rows) {
            let projectData = row.data;
            let changed = false;

            if (projectData.projects) {
                projectData.projects = projectData.projects.map(p => {
                    let projectChanged = false;
                    const updatedNodes = p.nodes.map(node => {
                        if (node.data.uptimeKumaId === monitorId) {
                            if (node.data.status !== status || node.data.latency !== latency) {
                                projectChanged = true;
                                changed = true;
                                return { ...node, data: { ...node.data, status, latency } };
                            }
                        }
                        return node;
                    });

                    if (projectChanged) {
                        return { ...p, nodes: updatedNodes, updatedAt: Date.now() };
                    }
                    return p;
                });
            }

            if (changed) {
                await pool.query('UPDATE projects SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(projectData), row.id]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch Uptime Kuma Monitors
app.get('/api/uptime-kuma/monitors', isAuthenticated, async (req, res) => {
    const url = process.env.UPTIME_KUMA_URL;
    const username = process.env.UPTIME_KUMA_USERNAME;
    const password = process.env.UPTIME_KUMA_PASSWORD;

    if (!url || !username || !password) {
        return res.status(400).json({ error: 'Uptime Kuma credentials not configured' });
    }

    console.log(`Fetching monitors from ${url}...`);

    const socket = io(url, {
        reconnection: false,
        timeout: 10000,
        transports: ['websocket', 'polling'] // Ensure compatibility
    });

    try {
        const monitors = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Timeout connecting to Uptime Kuma'));
            }, 10000);

            socket.on('connect', () => {
                console.log('Socket connected to Uptime Kuma, logging in...');
                socket.emit('login', { username, password }, (authRes) => {
                    if (authRes && authRes.ok) {
                        console.log('Login successful, fetching monitor list...');
                        socket.emit('getMonitorList', (list) => {
                            clearTimeout(timeout);
                            socket.disconnect();
                            resolve(Object.values(list).map(m => ({
                                id: m.id,
                                name: m.name,
                                status: m.status === 1 ? 'online' : (m.status === 0 ? 'offline' : 'warning'),
                                latency: m.ping ? `${m.ping}ms` : null,
                                msg: m.msg
                            })));
                        });
                    } else {
                        clearTimeout(timeout);
                        socket.disconnect();
                        reject(new Error(authRes?.msg || 'Authentication failed'));
                    }
                });
            });

            socket.on('connect_error', (err) => {
                clearTimeout(timeout);
                socket.disconnect();
                reject(new Error(`Connection error: ${err.message}`));
            });
        });

        res.json(monitors);
    } catch (err) {
        console.error('Uptime Kuma API Error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
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
