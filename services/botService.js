// src/services/botService.js
const { loadCommands } = require('../handlers/commandHandler');
const { loadEvents } = require('../handlers/eventHandler');
const { connectDatabase } = require('./databaseService');
const { checkExternalAPIs } = require('./apiService');
const { deployCommands } = require('./deployService');
const { logError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

async function initializeBot(client) {
    console.log('🔎 Lancement du bot...');

    // 1) Connexion à la DB
    await connectDatabase();

    // 2) Test de connexion aux API externes
    await checkExternalAPIs();

    // 3) Charger les commandes et événements
    loadCommands(client);
    loadEvents(client);

    // 4) Déployer les commandes slash (si nécessaire)
    await deployCommands(client);

    // 5) Gestion des erreurs globales
    process.on('unhandledRejection', (error) => logError('UnhandledRejection', error));
    process.on('uncaughtException', (error) => logError('UncaughtException', error));

    // 6) Se connecter à Discord
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Bot connecté avec succès !');
}

module.exports = { initializeBot };
