// services/apiEventService.js
const config = require('../config');
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Récupère les détails d'un événement via l'API TheSportsDB.
 * Pour les matchs à venir, tu peux utiliser l'endpoint "lookupevent.php" ou un autre adapté.
 * Le paramètre isUpcoming permet de distinguer les matchs futurs des matchs passés.
 */
async function fetchAndStoreEvent(eventId, isUpcoming = false) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error('fetchAndStoreEvent -> API_KEY_THE_SPORTS_DB non défini.');
      return null;
    }
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
    logger.info(`fetchAndStoreEvent -> Récupération de l'événement ID=${eventId}`);
    const data = await fetchData(url);
    if (data && data.events && data.events.length > 0) {
      const event = data.events[0];
      logger.info(`fetchAndStoreEvent -> Événement trouvé: ${event.strEvent}`);
      const query = `
        INSERT INTO api_events (id_event, strEvent, dateEvent, isUpcoming)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_event) DO UPDATE
          SET strEvent = EXCLUDED.strEvent,
              dateEvent = EXCLUDED.dateEvent,
              isUpcoming = EXCLUDED.isUpcoming,
              updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [event.idEvent, event.strEvent, event.dateEvent, isUpcoming];
      await db.query(query, values);
      logger.info(`fetchAndStoreEvent -> Données de l'événement ${event.idEvent} mises à jour en BDD.`);
      return event;
    } else {
      logger.warn(`fetchAndStoreEvent -> Aucun événement trouvé pour ID=${eventId}`);
      return null;
    }
  } catch (error) {
    logger.error(`fetchAndStoreEvent -> Erreur pour l'événement ${eventId}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreEvent };
