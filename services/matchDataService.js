// services/matchDataService.js
const { fetchData } = require('./apiRequestsService');
const db = require('../utils/database');
const logger = require('../utils/logger');
require('dotenv').config();

async function fetchAndStoreUpcomingMatches(teamName) {
  try {
    const apiKey = process.env.API_KEY_THE_SPORTS_DB;
    if (!apiKey) {
      logger.error("fetchAndStoreUpcomingMatches -> API_KEY_THE_SPORTS_DB non défini.");
      return;
    }
    // Utilisation de l'endpoint "eventsnext.php?t="
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnext.php?t=${encodeURIComponent(teamName)}`;
    logger.info(`fetchAndStoreUpcomingMatches -> Récupération des matchs à venir pour ${teamName}`);
    const data = await fetchData(url);
    if (data && data.events && data.events.length > 0) {
      for (const event of data.events) {
        const query = `
          INSERT INTO upcoming_matches (id_event, strEvent, dateEvent)
          VALUES ($1, $2, $3)
          ON CONFLICT (id_event) DO UPDATE
            SET strEvent = EXCLUDED.strEvent,
                dateEvent = EXCLUDED.dateEvent,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const values = [event.idEvent, event.strEvent, event.dateEvent];
        await db.query(query, values);
      }
      logger.info(`fetchAndStoreUpcomingMatches -> ${data.events.length} matchs à venir pour ${teamName} mis à jour en BDD.`);
    } else {
      logger.warn(`fetchAndStoreUpcomingMatches -> Aucun match trouvé pour ${teamName}`);
    }
  } catch (error) {
    logger.error(`fetchAndStoreUpcomingMatches -> Erreur pour ${teamName}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchAndStoreUpcomingMatches };
