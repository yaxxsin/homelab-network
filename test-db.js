import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgres://homelab_user:homelab_password@localhost:5433/homelab_db'
});

async function test() {
    console.log('Testing connection to localhost:5433...');
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('SUCCESS: Connected to database at', res.rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('FAILED: Could not connect to database.');
        console.error('Error message:', err.message);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    }
}

test();
