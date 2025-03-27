// services/apiDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreEvent(eventId) {
  logger.info(`fetchAndStoreEvent -> Début de la récupération de l'événement ID=${eventId}.`);
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error('fetchAndStoreEvent -> API_KEY_THE_SPORTS_DB non défini.');
      return null;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
    logger.info(`fetchAndStoreEvent -> Appel de fetchData sur ${url}`);
    const data = await fetchData(url);
    logger.info(`fetchAndStoreEvent -> fetchData terminé pour ${url}`);
    
    if (data && data.events && data.events.length > 0) {
      const event = data.events[0];
      logger.info(`fetchAndStoreEvent -> Événement trouvé: ${event.strEvent}.`);
      const query = `
        INSERT INTO api_events (id_event, strEvent, dateEvent)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_event) DO UPDATE
          SET strEvent = EXCLUDED.strEvent,
              dateEvent = EXCLUDED.dateEvent,
              updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [event.idEvent, event.strEvent, event.dateEvent];
      logger.info(`fetchAndStoreEvent -> Exécution de la requête SQL pour l'événement ${event.idEvent}.`);
      await db.query(query, values);
      logger.info(`fetchAndStoreEvent -> Données de l'événement ${event.idEvent} mises à jour en BDD.`);
      return event;
    } else {
      logger.warn(`fetchAndStoreEvent -> Aucun événement trouvé pour ID=${eventId}.`);
      return null;
    }
  } catch (error) {
    logger.error(`fetchAndStoreEvent -> Erreur lors de la récupération de l'événement ${eventId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreEvent };
