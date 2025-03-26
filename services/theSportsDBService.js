// services/externalApiService.js
const { fetchData } = require('./apiRequestsService');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Récupère les détails d'un événement via TheSportsDB
 * @param {string|number} eventId
 * @returns {Promise<Object|null>}
 */
async function getEventDetails(eventId) {
  try {
    const apiKey = process.env.THE_SPORTSDB_API_KEY;
    if (!apiKey) {
      logger.error('getEventDetails -> THE_SPORTSDB_API_KEY non défini.');
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

module.exports = {
  getEventDetails
};
