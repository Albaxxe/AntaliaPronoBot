// services/apiDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreEvent(eventId) {
  const apiKey = process.env.API_KEY_THE_SPORTS_DB;
  if (!apiKey) {
    logger.error('API_KEY_THE_SPORTS_DB non défini.');
    return null;
  }
  const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupevent.php?id=${eventId}`;
  logger.info(`Récupération de l'événement ID=${eventId} via API V1...`);
  const data = await fetchData(url);
  if (data && data.events && data.events.length > 0) {
    const event = data.events[0];
    // Exemple d'insertion dans la table api_events
    const query = `
      INSERT INTO api_events (id_event, strevent, dateevent, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id_event) DO UPDATE
        SET strevent = EXCLUDED.strevent,
            dateevent = EXCLUDED.dateevent,
            updated_at = CURRENT_TIMESTAMP;
    `;
    const values = [event.idEvent, event.strEvent, event.dateEvent];
    await db.query(query, values);
    logger.info(`Données de l'événement ${event.idEvent} mises à jour en BDD.`);
    return event;
  } else {
    logger.warn(`Aucun événement trouvé pour ID=${eventId}`);
    return null;
  }
}

module.exports = { fetchAndStoreEvent };
