const { Pool } = require('pg');

// DATABASE_URL должен быть задан (Railway/Supabase/Neon)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL не задан. Укажите строку подключения к Postgres.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
});

async function initializeDatabase() {
    // Создаём таблицы, если их нет
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS habits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            frequency TEXT,
            completed_dates JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    console.log('✅ Подключено к Postgres, таблицы проверены/созданы');
}

function toPg(sql) {
    // Преобразуем плейсхолдеры SQLite (?) в Postgres ($1, $2, ...)
    let idx = 0;
    return sql.replace(/\?/g, () => {
        idx += 1;
        return `$${idx}`;
    });
}

async function run(sql, params = []) {
    const res = await pool.query(toPg(sql), params);
    return { id: res.rows?.[0]?.id, rows: res.rows, rowCount: res.rowCount };
}

async function get(sql, params = []) {
    const res = await pool.query(toPg(sql), params);
    return res.rows[0];
}

async function all(sql, params = []) {
    const res = await pool.query(toPg(sql), params);
    return res.rows;
}

module.exports = {
    initializeDatabase,
    run,
    get,
    all,
    pool
};