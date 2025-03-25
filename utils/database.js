const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.connect()
    .then(() => console.log('✅ Connexion PostgreSQL réussie !'))
    .catch(err => console.error('❌ Erreur connexion PostgreSQL :', err.message));

module.exports = pool;
