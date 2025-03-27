// services/apiDataService.js
const { getEventDetails } = require('./externalApiService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreEvent(eventId) {
  try {
    logger.info(`fetchAndStoreEvent -> Récupération de l'événement ID=${eventId} via l'API...`);
    const event = await getEventDetails(eventId);
    if (!event) {
      logger.warn(`fetchAndStoreEvent -> Aucun événement trouvé pour ID=${eventId}`);
      return null;
    }
    const query = `
      INSERT INTO api_events (id_event, strEvent, dateEvent)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_event) DO UPDATE
        SET strEvent = EXCLUDED.strEvent,
            dateEvent = EXCLUDED.dateEvent,
            updated_at = CURRENT_TIMESTAMP;
    `;
    const values = [event.idEvent, event.strEvent, event.dateEvent];
    await db.query(query, values);
    logger.info(`fetchAndStoreEvent -> Données de l'événement ${event.idEvent} mises à jour en BDD.`);
    return event;
  } catch (error) {
    logger.error(`fetchAndStoreEvent -> Erreur pour l'événement ${eventId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreEvent };
