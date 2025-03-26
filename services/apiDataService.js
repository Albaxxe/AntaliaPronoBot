// services/apiDataService.js
const { getEventDetails } = require('./externalApiService');
const db = require('../utils/database');
const logger = require('../utils/logger'); // Assure-toi d'avoir créé utils/logger.js avec Winston
require('dotenv').config();

/**
 * Récupère les données d'un événement via TheSportsDB et les stocke (ou met à jour) dans la table api_events.
 * @param {number|string} eventId - L'ID de l'événement à récupérer.
 * @returns {Promise<void>}
 */
async function fetchAndStoreEvent(eventId) {
  try {
    logger.info(`fetchAndStoreEvent -> Récupération de l'événement ID=${eventId} via l'API...`);
    const eventData = await getEventDetails(eventId);
    if (!eventData) {
      logger.warn(`fetchAndStoreEvent -> Aucun événement trouvé pour l'ID ${eventId}`);
      return;
    }
    // On suppose que eventData contient idEvent, strEvent, et dateEvent
    const query = `
      INSERT INTO api_events (id_event, strEvent, dateEvent)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_event) DO UPDATE
        SET strEvent = EXCLUDED.strEvent,
            dateEvent = EXCLUDED.dateEvent,
            updated_at = CURRENT_TIMESTAMP;
    `;
    const values = [eventData.idEvent, eventData.strEvent, eventData.dateEvent];
    await db.query(query, values);
    logger.info(`fetchAndStoreEvent -> Données de l'événement ${eventData.idEvent} mises à jour en BDD.`);
  } catch (error) {
    logger.error(`fetchAndStoreEvent -> Erreur pour l'événement ${eventId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreEvent };
