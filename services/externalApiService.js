// services/externalApiService.js
const { fetchData } = require('./apiRequestsService');
const logger = require('../utils/logger');
require('dotenv').config();

async function getEventDetails(eventId) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB; // Utilise la clé définie dans .env
    if (!apiKey) {
      logger.error('getEventDetails -> API_KEY_THE_SPORTS_DB non défini.');
      return null;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
    logger.info(`getEventDetails -> Récupération de l'événement ID=${eventId}`);
    const data = await fetchData(url);
    if (data && data.events && data.events.length > 0) {
      logger.info(`getEventDetails -> Événement trouvé: ${data.events[0].strEvent}`);
      return data.events[0];
    } else {
      logger.warn(`getEventDetails -> Aucun événement trouvé pour ID=${eventId}`);
      return null;
    }
  } catch (error) {
    logger.error(`getEventDetails -> Erreur: ${error.message}`);
    throw error;
  }
}

module.exports = { getEventDetails };
