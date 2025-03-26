// services/apiDataService.js
const { getEventDetails } = require('./externalApiService');
const db = require('../utils/database');
const logger = require('../utils/logger');

async function fetchAndStoreEvent(eventId) {
  try {
    logger.info(`fetchAndStoreEvent -> Récupération de l'événement ID=${eventId}`);
    const event = await getEventDetails(eventId);
    if (!event) {
      logger.warn(`fetchAndStoreEvent -> Aucune donnée pour ID=${eventId}`);
      return;
    }
    // Ex: on insère dans une table "api_events"
    const query = `
      INSERT INTO api_events (id_event, strEvent, dateEvent)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_event) DO UPDATE
        SET strEvent = EXCLUDED.strEvent,
            dateEvent = EXCLUDED.dateEvent;
    `;
    const values = [event.idEvent, event.strEvent, event.dateEvent];
    await db.query(query, values);
    logger.info(`fetchAndStoreEvent -> Données insérées/mises à jour pour ID=${event.idEvent}`);
  } catch (error) {
    logger.error(`fetchAndStoreEvent -> Erreur: ${error.message}`);
    throw error;
  }
}

module.exports = {
  fetchAndStoreEvent
};
