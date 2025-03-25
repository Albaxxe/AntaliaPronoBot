// src/services/databaseService.js
const db = require('../utils/database');

async function connectDatabase() {
    console.log('🔄 Test de connexion à PostgreSQL...');
    try {
        const res = await db.query('SELECT current_database() as dbName, NOW() as currentTime;');
        console.log(`✅ Connexion BDD réussie : ${res.rows[0].dbname} — ${res.rows[0].currenttime}`);
    } catch (error) {
        console.error('❌ Erreur connexion PostgreSQL :', error.message);
        console.error('🔍 Vérifie si PostgreSQL tourne et accepte les connexions.');
        throw error; // on remonte l'erreur
    }
}

module.exports = { connectDatabase };
