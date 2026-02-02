import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgres://homelab_user:homelab_password@localhost:5433/homelab_db'
});

async function check() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables found:', res.rows.map(r => r.table_name).join(', '));

        for (const table of res.rows) {
            const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table.table_name}'`);
            console.log(`- Table ${table.table_name} columns:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error during schema check:', err.message);
        process.exit(1);
    }
}

check();
